/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var app = express();
var cfenv = require('cfenv');
var fs = require('fs');

var bodyParser = require('body-parser');
var http = require('http');

// load local VCAP configuration
var vcapLocal = null;
var appEnv = null;
var appEnvOpts = {};

app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000);

fs.stat('./vcap-local.json', function (err, stat) {
    if (err && err.code === 'ENOENT') {
        // file does not exist
        console.log('No vcap-local.json');
        initializeAppEnv();
    } else if (err) {
        console.log('Error retrieving local vcap: ', err.code);
    } else {
        vcapLocal = require("./vcap-local.json");
        console.log("Loaded local VCAP", vcapLocal);
        appEnvOpts = {
            vcap: vcapLocal
        };
        initializeAppEnv();
    }
});


// get the app environment from Cloud Foundry, defaulting to local VCAP
function initializeAppEnv() {
    appEnv = cfenv.getAppEnv(appEnvOpts);
    if (appEnv.isLocal) {
        require('dotenv').load();
    }
    if (appEnv.services.cloudantNoSQLDB) {
        initCloudant();
    } else {
        console.error("No Cloudant service exists.");
    }
}


// =====================================
// CLOUDANT SETUP ======================
// =====================================
var dbname = "data";
var database;

function initCloudant() {
    var cloudantURL = appEnv.services.cloudantNoSQLDB[0].credentials.url || appEnv.getServiceCreds("interface-zos-cloudantNoSQLDB").url;
    var Cloudant = require('cloudant')({
        url: cloudantURL,
        plugin: 'retry',
        retryAttempts: 10,
        retryTimeout: 500
    });
    // Create the accounts Logs if it doesn't exist
    Cloudant.db.create(dbname, function (err, body) {
        if (err && err.statusCode == 412) {
            console.log("Database already exists: ", dbname);
        } else if (!err) {
            console.log("New database created: ", dbname);
        } else {
            console.log('Cannot create database!');
        }
    });
    database = Cloudant.db.use(dbname);
}
// Create/check the document existance

//Login endpoint
app.post('/login', function (req, res) {

    database.get('users', {
        revs_info: true
    }, function (err, doc) {
        if (err) {
            console.log(err);
            res.setHeader('Content-Type', 'application/json');
            res.status(500).json({ message: "An Error Has Ocurred", authenticated: false });
        } else {
            var login = req.body.login;
            var password = req.body.password;
            var exists = false;
            var userFound;
            for (var user in doc.users) {
                console.log(doc.users[user]);
                if (doc.users[user].username === login) {
                    exists = true;
                    userFound = user;
                }
            }
            if (exists) {
                if (doc.users[userFound].username === login && doc.users[userFound].password === password) {

                    console.log("Authentication Success");
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: "Authentication Success", authenticated: true });
                } else {
                    console.log("Invalid Password");
                    res.setHeader('Content-Type', 'application/json');
                    res.status(403).json({ message: "Invalid Password", authenticated: false });
                }

            } else {
                console.log("User Not Found");
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: "User Not Found", authenticated: false });
            }

        }



    });

});





http.createServer(app).listen(app.get('port'), '0.0.0.0', function () {
    console.log('Express server listening on port ' + app.get('port'));
});
