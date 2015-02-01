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
 	get(req,'data/config.json',res);
});

app.post('/config.json', function(req, res) {
	saveJson(req,'data/config.json',req.body);
 	res.send('{"status":"ok"}');
});


app.post('/status.json', function(req, res) {
	saveJson(req,'data/status.json',req.body);
 	res.send('{"status":"ok"}');
});

app.get('/status.json', function(req, res) {
 	get(req,'data/status.json',res);
});


app.post('/schedule.json', function(req, res) {
	saveJson(req,'data/schedule.json',req.body);
 	res.send('{"status":"ok"}');
});

app.get('/schedule.json', function(req, res) {
	get(req,'data/schedule.json',res);
});


app.get('/thermos.log', function(req, res) {
	res.setHeader('content-type', 'text/plain');
	get(req,'logs/thermos.log',res);
});

app.get('/restApi.log', function(req, res) {
	res.setHeader('content-type', 'text/plain');
	get(req,'logs/restApi.log',res);
});

app.get('/stats/:year(\\d+)/:month(\\d+)', function(req, res) {
	res.setHeader('content-type', 'text/plain');
	getStats(req,'data/stats-'+req.params.year+'-'+req.params.month+'.log',res);
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

function get(req, filename, res){
	read(req, filename, function(data){ res.send(data); } );
}

function getStats(req, filename, res){
	read(req, filename, function(data){
		time = [];
		timeseries = [];
		timeseries[0] = [];
		timeseries[1] = [];
		timeseries[2] = [];
		timeseries[3] = [];
		
		lines = data.split("\n");
		for (i = 0; i < lines.length; i++) {		
			line = lines[i].split("\t");
			if(line.length>1){
				time.push(line[0]);
				timeseries[0].push([line[0],line[1]]);
				timeseries[1].push([line[0],line[2]]);
				timeseries[2].push([line[0],line[3]]);
				timeseries[3].push([line[0],line[4]]);
			}
		}
		var tt= {};
		tt.timeseries = timeseries; 
		tt.time = time; 
		res.send(JSON.stringify(tt)); 
	} 
	);
}

function read(req, filename, callback){
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
