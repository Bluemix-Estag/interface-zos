var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var cfenv = require('cfenv');
var fs = require('fs');
var bodyParser = require('body-parser');



app.use(bodyParser.json());


app.set('port', process.env.PORT || 3000);

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


app.post('/info', function (req, res) {
    console.log('Login method invoked..')
    database.get('users', {
        revs_info: true
    }, function (err, doc) {
        if (err) {
            console.log(err);
            res.setHeader('Content-Type', 'application/json');
            res.status(500).json({ message: "An Error Has Ocurred", authenticated: false,status : 500 });
        } else {
            // console.log('body'+ JSON.stringify(req.body));
            var login = req.body.login;
            var password = req.body.password;
            var exists = false;
            var userFound;
            console.log('Received data: ',login);
            for (var user in doc.users) {
                console.log(doc.users[user]);
                if (doc.users[user].username === login) {
                    exists = true;
                    userFound = user;
                }
            }
            if (exists) {
                if (doc.users[userFound].username.localeCompare(login)==0 && doc.users[userFound].password.localeCompare(password)==0) {

                    console.log("Authentication Success");
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({ message: "Authentication Success", authenticated: true , status:200});

                } else {
                    console.log("Invalid Password");
                    res.setHeader('Content-Type', 'application/json');
                    res.status(403).json({ message: "Invalid Password", authenticated: false, status:403 });
                }

            } else {
                console.log("User Not Found");
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({ message: "User Not Found", authenticated: false ,status: 404 });
            }
        }
    });
});


app.listen(3000);
console.log('Listening on port 3000');