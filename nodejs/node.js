var express = require('express');
var bodyParser = require('body-parser')
var basicAuth = require('basic-auth-connect');
var moment = require('moment');
var fs = require('fs');

var app = express();

app.use(bodyParser.json());
app.use(basicAuth("mots", "mots"));
app.use('/', express.static(__dirname + '/public'));

//json get
app.get('/:filename(config\.json|status\.json|schedule\.json)', function(req, res) {
 	get(req, res, 'data/' + req.params.filename);
});

//json post
app.post('/:filename(config\.json|status\.json|schedule\.json)', function(req, res) {
	save(req, res, 'data/' + req.params.filename, JSON.stringify(req.body));
});

//logs
app.get('/:filename([a-zA-Z0-9\-_]+\.log)', function(req, res) {
	res.setHeader('content-type', 'text/plain');
	get(req, res, 'logs/' + req.query.filename);
});

//stats
app.get('/stats/:year(\\d+)/:month(\\d+)', function(req, res) {
	res.setHeader('content-type', 'application/json');
	getStats(req, res, 'data/stats-' + req.params.year + '-' + req.params.month + '.log');
});


//utility file functions

function save(req, res, filename, data){
	fs.writeFile(__dirname+'/../'+filename, data, function(err) {
		if(err) {
			logerror(req,err);
			res.send('{"status":"ok"}');
		} else {
			info(req,'saved file ' + filename);
			res.send('{"status":"error"}');
		}
	});
}

function get(req, res, filename){
	read(req, res, filename, function(data){ res.send(data); } );
}

function getStats(req, res, filename){
	read(req, res, filename, 
		function(data){
			if(!data){
				res.status(404).send('Not found');
				return;
			}
			time = [];
			timeseries = [];
			timeseries[0] = [];
		
			lines = data.split("\n");
			for (i = 0; i < lines.length; i++) {		
				line = lines[i].split("\t");
				if(line.length>1){
					time.push(line[0]);
					for(j = 0; j<line.length-1; j++){
						if(!timeseries[j]){
							timeseries[j]=[]
						}
						timeseries[j].push([line[0],line[j+1]]);
					}
				}
			}
			var tt= {};
			tt.timeseries = timeseries; 
			tt.time = time; 
			res.send(JSON.stringify(tt)); 
		} 
	);
}

function read(req, res, filename, callback){
	fs.readFile(__dirname+'/../'+filename, 'utf8', function (err,data) {
		if (err) {
			logerror(req, err);
			res.send('{"status":"error"}');
		}else{
			info(req, 'read file ' + filename);
			callback(data);
		}
	});
}

//logging
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
