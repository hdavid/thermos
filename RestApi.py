#!/usr/bin/python
from flask import Flask, request, Response
from threading import Thread
from functools import wraps
from config import *

#
# REST API for thermos. 
# 
# this module requires Flask.
# to install flask : sudo pip install flask
#

app = Flask("restApi")

def check_auth(username, password):
	"""This function is called to check if a username /
	password combination is valid.
	"""
	return username == restapi_login and password == restapi_password

def authenticate():
	"""Sends a 401 response that enables basic auth"""
	return Response(
	'Could not verify your access level for that URL.\n'
	'You have to login with proper credentials', 401,
	{'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
	@wraps(f)
	def decorated(*args, **kwargs):
		auth = request.authorization
		if not auth or not check_auth(auth.username, auth.password):
			return authenticate()
		return f(*args, **kwargs)
	return decorated

@app.route('/status.json', methods=['GET'])
@requires_auth
def status_get():
	return get("status.json")

@app.route('/schedule.json', methods=['POST'])
@requires_auth
def schedule_put():
	return put("schedule.json",request.data)

@app.route('/schedule.json', methods=['GET'])
@requires_auth
def schedule_get(): 
	return get("schedule.json")

@app.route('/config.json', methods=['POST'])
@requires_auth
def config_put():
	print(str(request))
	return put("config.json", request.get_json())

@app.route('/config.json', methods=['GET'])
@requires_auth
def config_get():
	return get("config.json")

@app.route('/')
@requires_auth
def root():
	return app.send_static_file('index.html')

@app.route('/<path:path>')
@requires_auth
def static_proxy(path):
	return app.send_static_file(path)

def put(filename, data):
	f = open(filename,'w')
	f.write(str(data).replace('u\'','"').replace('\'','"'))
	f.close()
	return "200"

def get(filename):
	f = open(filename, 'r')
	lines = f.read() 
	f.close()
	return(lines)
		

# Run the app :)
if __name__ == '__main__':
	app.run(host="0.0.0.0", port=int(restapi_port))