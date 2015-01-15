
import datetime
import time

class Logger(object):
   	
	def _error(self, message):
		now = datetime.datetime.now()
		print(str(now) + " - ERROR: " + str(message))

	def _info(self, message):
		now = datetime.datetime.now()
		print(str(now) + " - " + str(message))
		
	