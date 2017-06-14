var PORT = 4000;

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
// var routes = require('./routes/routes');
var path = require('path');
var socketIO = require('socket.io')(http);
var fs = require('fs');
var cfenv = require('cfenv');
var request = require('request');
var moment = require('moment');


app.use(bodyParser.json());
app.set('port', process.env.PORT || PORT);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// app.get('/', routes.index);

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
    // Create/check the document existance
    database.get('main', {
        revs_info: true
    }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('Document already exists.');
            mainframeDB();
        }
    });
}
// app.post('/mainframe', function (req, res) {
function mainframeDB() {
    database.get('main', {
        revs_info: true
    }, function (err, doc) {
        if (err) {
            console.error(err);
        } else {
            console.log('entrou no acessado');
            var valores = doc.status.valor;
            var date = moment().format();
            var value = Math.ceil(Math.random() * 99);
            valores.push([value, date]);
            // console.log(valores);
            doc.status.valor = valores;
            database.insert(doc, 'main', function (err, doc) {
                if (err) {
                    // res.setHeader('Content-Type', 'application/json');
                    // res.status(400).json({
                    // message: "Could not handle the request",
                    // status: false
                    // });
                } else {

                    var options = {
                        uri: 'http://localhost:3000/inserted',
                        method: 'POST'
                    }

                    function callback(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            //    res.setHeader('Content-Type', 'application/json');
                            // console.log(JSON.stringify(doc));
                        } else {
                            console.log(JSON.stringify(doc));
                        }
                    }

                    request(options, callback);
                }
            });
        }
        setTimeout(function () {
            mainframeDB();
        }, 5000);

    });
}

// function mainframeHist() {
//     database.get('main', {
//         revs_info: true
//     }, function (err, doc) {
//         if (err) {
//             console.log(err);
//         } else {
//             var valores = doc.status.valor;


//         }
//     });
// }




http.listen(app.get('port'), '0.0.0.0', function () {
    console.log('Express server listening on port ' + app.get('port'));
});