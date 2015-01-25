var express = require('express');
var bodyParser = require('body-parser')
var _ = require('underscore');
var basicAuth = require('basic-auth-connect');
var moment = require('moment');
var fs = require('fs');
var app = express();

var login = "mots";
var password = "mots";

app.use(bodyParser.json());
app.use(basicAuth(login, password));
app.use('/', express.static(__dirname + '/../static'));


app.get('/config.json', function(req, res) {
 	get(req,'config.json',res);
});

app.post('/config.json', function(req, res) {
	saveJson(req,'config.json',req.body);
 	res.send('{"status":"ok"}');
});


app.post('/status.json', function(req, res) {
	saveJson(req,'status.json',req.body);
 	res.send('{"status":"ok"}');
});

app.get('/status.json', function(req, res) {
 	get(req,'status.json',res);
});


app.post('/schedule.json', function(req, res) {
	saveJson(req,'schedule.json',req.body);
 	res.send('{"status":"ok"}');
});

app.get('/schedule.json', function(req, res) {
	get(req,'schedule.json',res);
});


app.get('/thermos.log', function(req, res) {
	res.setHeader('content-type', 'text/plain');
	get(req,'thermos.log',res);
});

app.get('/restApi.log', function(req, res) {
	res.setHeader('content-type', 'text/plain');
	get(req,'restApi.log',res);
});


function saveJson(req,filename,json){
	fs.writeFile(__dirname+'/../'+filename, JSON.stringify(json), function(err) {
	    if(err) {
	        logerror(req,err);
	    } else {
	        info(req,'saved file ' + filename);
	    }
	});
}

function get(req,filename,res){
	read(req,filename,function(data){res.send(data);});
}


function read(req,filename,callback){
	fs.readFile(__dirname+'/../'+filename, 'utf8', function (err,data) {
		if (err) {
			logerror(req,err);
			return error(err);
		}
		info(req,'read file ' + filename);
		callback(data);
	});
}

function info(request, message){
	if(request && request.connection && request.connection.remoteAddress){
		console.log(getDate()+"\tINFO\t"+request.connection.remoteAddress + "\t"+message);
	}else{
		console.log(getDate()+"\tINFO\t\t"+ "\t"+request);	
	}
}

function logerror(request, message){
	if(request && request.connection && request.connection.remoteAddress){
		console.log(getDate()+"\tERROR\t"+request.connection.remoteAddress + "\t"+message);
	}else{
		console.log(getDate()+"\tERROR\t\t"+ "\t"+request);	
	}
}

function getDate(){
	return(moment().format());
}


var port = 8080;
var ip = '0.0.0.0'
app.listen(port, ip);
info('\n\n\n');
info('Server started at http://'+ip+':'+port);
