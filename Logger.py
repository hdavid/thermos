
import datetime
import time
import logging

logfile = open("thermos.log", "a") 

class Logger(object):
   	
	def _error(self, message):
		now = datetime.datetime.now()
		logfile.write(str(now) + " - ERROR: " + str(message)+"\n")
		logfile.flush()
		
	def _info(self, message):
		now = datetime.datetime.now()
		logfile.write(str(now) + " - " + str(message)+"\n")
		logfile.flush()
		