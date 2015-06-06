from __future__ import print_function
from Logger import Logger
import datetime
import time
import traceback
import json
import os.path


class Schedule(Logger):
			
	def __init__(self, entries = None, filename = None):
		self._file_date = None
		self._filename = filename
		if(self._filename != None):
			self._info("loading schedule from '"+self._filename+"'")
			self._load(self._filename)
		elif entries!=None:	
			self.entries = entries
		else:
			self.entries = []
		
	def reload(self):
		if(self._filename != None):
			if self._file_date == None or self._file_date != os.path.getmtime(self._filename):
				try:
					self._info("reloading schedule from "+self._filename)
					self._load(self._filename)
				except Exception:
					self._error("could not reload schedule.")
					traceback.print_exc()
	
	def _load(self, filename):
		json_file=open(filename)
		json_data = json.load(json_file)
		json_file.close()
		self.from_json(json_data)
		self._file_date = os.path.getmtime(self._filename)
		
	def save(self, filename):
		try:
			f = file(filename, 'w') 
			for entry in self.entries: 
				print(str(entry),file=f)
			f.close()
			self._file_date = os.path.getmtime(self._filename)
		except:
			self._error("could not write schedule file")
			traceback.print_exc()
	
	def get_active_entry(self):
		for entry in self.entries:
			if entry.is_active():
				return entry
		return None
	
	def __str__(self):
		s = ""
		for entry in self.entries: 
			s=s+"\n"+str(entry)
		return s
		
	def to_json(self):
		s = "{"
		s = s+"\n\t\"entries\": ["
		i = 0
		for entry in self.entries: 
			if i>0:
				s = s+","
			s=s+entry.to_json()	
			i = i + 1
			
		s = s+"\n]\n}"	
		return s
	
	def from_json(self, jsondata):
		entries = []
		for entry_json in jsondata["entries"]:
			entry = ScheduleEntry()
			entry.from_json(entry_json)
			entries.append(entry)
		self.entries = entries

class ScheduleEntry(Logger):
	
	def __init__(self, temperature = 20, start_time = datetime.time(8,0,0), end_time = datetime.time(22, 0, 0),  days_of_the_week = [0,1,2,3,4,5,6]):
		self.temperature = temperature
		self.start_time = start_time
		self.end_time = end_time
		self.days_of_the_week = days_of_the_week #Monday is 0 and Sunday is 6.
		self.active = True
	
	def is_active(self):
		if not self.active:
			return False
		now = datetime.datetime.now()
		time = now.time()
		if now.weekday() in self.days_of_the_week:
			if self.start_time<=time and time<self.end_time:
				return True
		return False
	
	def __str__(self):
		return (str(self.temperature)+" "+\
		str(self.active)+" "+\
		str(self.start_time.strftime("%H:%M"))+" "+\
		str(self.end_time.strftime("%H:%M"))+" "+\
		str(self.days_of_the_week) )
		
	def from_json(self,json_data):
		self.temperature = float(json_data["temperature"])
		self.active = json_data["active"]
		self.start_time = datetime.datetime.strptime(json_data["start_time"], "%H:%M").time()
		self.end_time = datetime.datetime.strptime(json_data["end_time"], "%H:%M").time()
		self.days_of_the_week = json_data["days_of_the_week"]
	
	def to_json(self):
		return ("\n\t{"+\
		"\n\t\t\"temperature\":"+str(self.temperature)+","\
		"\n\t\t\"active\":\""+str(self.active)+"\","\
		"\n\t\t\"start_time\":\""+str(self.start_time.strftime("%H:%M"))+"\","+\
		"\n\t\t\"end_time\":\""+str(self.end_time.strftime("%H:%M"))+"\","+\
		"\n\t\t\"days_of_the_week\":"+str(self.days_of_the_week)+""\
		"\n\t}" )
		
		

