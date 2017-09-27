/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var path = require('path');
var app = express();
var cfenv = require('cfenv');
var fs = require('fs');
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
// var socketIO = require('socket.io')(http);
var request = require('request');

// load local VCAP configuration
var vcapLocal = null;
var appEnv = null;
var appEnvOpts = {};

app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));
app.use('/scripts', express.static(path.join(__dirname, '/views/scripts')));



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


app.get('/index', function (req, res) {
    res.render('index.html');
})

app.get('/', function (req, res) {
    res.render('login.html');
})

//Login endpoint
app.post('/login', function (req, res) {
    console.log('Login method invoked..')
    database.get('users', {
        revs_info: true
    }, function (err, doc) {
        if (err) {
            console.log(err);
            res.setHeader('Content-Type', 'application/json');
            res.status(500).json({
                message: "An Error Has Ocurred",
                authenticated: false,
                status: 500
            });
        } else {
            // console.log('body'+ JSON.stringify(req.body));
            var login = req.body.login;
            var password = req.body.password;
            var exists = false;
            var userFound;
            // console.log('Received data: ', login);
            for (var user in doc.users) {
                // console.log(doc.users[user]);
                if (doc.users[user].username === login) {
                    exists = true;
                    userFound = user;
                }
            }
            if (exists) {
                if (doc.users[userFound].username.localeCompare(login) == 0 && doc.users[userFound].password.localeCompare(password) == 0) {

                    console.log("Authentication Success");
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json({
                        message: "Authentication Success",
                        authenticated: true,
                        status: 200,
                        user: doc.users[userFound].username
                    });
                    console.log(doc.users[userFound].username);

                } else {
                    console.log("Invalid Password");
                    res.setHeader('Content-Type', 'application/json');
                    res.status(403).json({
                        message: "Invalid Password",
                        authenticated: false,
                        status: 403
                    });
                }

            } else {
                console.log("User Not Found");
                res.setHeader('Content-Type', 'application/json');
                res.status(404).json({
                    message: "User Not Found",
                    authenticated: false,
                    status: 404
                });
            }
        }
    });
});


app.get('/getInfo', function (req, res) {
    res.setHeader('Context-Type', 'application/json');
    var username = req.query.user;
    database.get('users', {
        revs_info: true
    }, function (err, doc) {
        if (err) {
            console.log('Error', err);
        } else {
            var users = doc.users;
            for (var user of users) {

                if (username === user.username) {
                    console.log('User found ' + JSON.stringify(user));
                    res.status(200).json(user);
                }
            }
        }
    })
})


app.get('/getCICSStatus', function (req, res) {
    var options = {
        method: 'GET',
        url: 'https://api.us.apiconnect.ibmcloud.com/bluemix-brasil-demos/sb/cicsinfo/obter',
        headers: {
            "x-ibm-client-id": '9af11b89-1596-43fb-9eb3-9e8c48cda4cf'
        }
    }

    function callback(error,response,body){
        if(!error && response.statusCode == 200){
            var info = JSON.parse(body);
            res.send(info);
        }else{
            console.log(error);
            res.send(error);
        }
    }
    request(options,callback);
})

app.get('/getSaldo', function (req, res) {
    
    var acc = (req.query.conta != '')?req.query.conta:null;
    console.log('Entrou no get saldo' + acc);

    //call mainframe api and return balance
    var options = {
        method: 'GET',
        url: 'https://api.us.apiconnect.ibmcloud.com/bluemix-brasil-demos/sb/contacorrente/consulta?nrConta='+acc,
        headers: {
            "x-ibm-client-id": '9af11b89-1596-43fb-9eb3-9e8c48cda4cf' 
        }
    }

    function callback(error, response,body){
        if(!error && response.statusCode == 200){
            var info = JSON.parse(body);
            console.log(info);
            if(info['resposta']){
                res.send(info['resposta']['MSGS_CLISALDO']);
            }
        }else{
            res.send(error);
            console.log(error);
        }
    }
    request(options,callback);
})

app.post('/pushDB', function(req,res){
    var info = req.body.info;

    database.get('main', {revs_info: true}, function(error, doc){
        var statusArr = []
        statusArr = doc['status']['valor']
        statusArr.push(info);
        database.insert(doc, 'main', function(err, body){
            console.log('You have updated the document');
            // console.log(body);
            res.send('You have updated the document.');
        })
    })
})

app.get('/getDB', function(req,res){
    database.get('main', {revs_info: true}, function(err,result){
        
        res.send(result['status']['valor']);
    })
})

app.get('/getDBTransactions', function(req,res){
    database.get('main', {revs_info: true}, function(err,result){
        
        res.send(result['status']['valor']);
    })
})

app.get('/getDBPrograms', function(req,res){
    database.get('main', {revs_info: true}, function(err,result){
        console.log('entrou no dbprograms');
        res.send(result['status']['valor']);
    })
})




http.listen(app.get('port'), '0.0.0.0', function () {
    console.log('Express server listening on port ' + app.get('port'));
})


