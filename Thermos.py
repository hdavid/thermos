#!/usr/bin/python
from Logger import Logger
from Schedule import Schedule, ScheduleEntry
import datetime
import time
import traceback
import json
import random
import os
import os.path
import glob
import time
import config

try: 
	import RPi.GPIO as GPIO
	THERMOS_HAS_GPIO = True
except:
	THERMOS_HAS_GPIO = False

class Thermos(Logger):

	def __init__(self):
		self._schedule_filename = "data/schedule.json"
		self._schedule = None
		self._current_temperatures = {}
		self._active_schedule_entry = None
		self._heating = None
		self._mode = None
		self._config_filename = "data/config.json"
		self._temperature_sensor_device_files = {}
		self._config_file_date = None
		self._status_filename = "data/status.json"
		self._manual_temperature = None
		self._config_needs_saving = False
		self._stats_needs_saving = False
		self._status_changed = False
		self._last_button_press = datetime.datetime.now()
		self._last_status_written = datetime.datetime.now()
		self._last_stats_written = datetime.datetime.now()
		
	def _setup_hardware(self):
		
		if THERMOS_HAS_GPIO:
			
			#temperature sensor
			try:
				os.system('modprobe w1-gpio')
				os.system('modprobe w1-therm')
				for key in config.thermos_temperature_sensor_sensors.keys():
					filename = config.thermos_temperature_sensor_directory+ "/" + config.thermos_temperature_sensor_sensors[key] + '/w1_slave'
					if os.path.isfile(filename):
						self._temperature_sensor_device_files[key]=filename
					else:
						self._error("sensor file '"+filename+"' does not exist.")
			except:
				self._error("could not locate temperature sensor file. will use random values for temperature")
				
			#GPIO SETUP
			GPIO.setmode(GPIO.BCM)
			GPIO.setwarnings(False)
			GPIO.cleanup()
			
			#led pins
			GPIO.setup(config.thermos_gpio_heating_led,GPIO.OUT)
			GPIO.setup(config.thermos_gpio_schedule_led,GPIO.OUT)
			GPIO.setup(config.thermos_gpio_manual_led,GPIO.OUT)
		
			#mode button
			GPIO.setup(config.thermos_gpio_mode_button, GPIO.IN, pull_up_down=GPIO.PUD_UP)
			GPIO.add_event_detect(config.thermos_gpio_mode_button, GPIO.RISING, callback=self._button_callback) 
			#manual temperature up button
			GPIO.setup(config.thermos_gpio_up_button, GPIO.IN, pull_up_down=GPIO.PUD_UP)
			GPIO.add_event_detect(config.thermos_gpio_up_button, GPIO.RISING, callback=self._button_callback)
			#manual temperature down button
			GPIO.setup(config.thermos_gpio_down_button, GPIO.IN, pull_up_down=GPIO.PUD_UP)
			GPIO.add_event_detect(config.thermos_gpio_down_button, GPIO.RISING, callback=self._button_callback)
			
		else:
			self._error("no GPIO kernel module found. will use dummy temperature readings. make sure you installed the kernel modules.")
			
	
	def _cleanup_hardware(self):
		if THERMOS_HAS_GPIO:
			GPIO.output(config.thermos_gpio_schedule_led,GPIO.LOW)
			GPIO.output(config.thermos_gpio_manual_led,GPIO.LOW)
			GPIO.output(config.thermos_gpio_heating_led,GPIO.LOW)
			
	def _button_callback(self, channel):
		#debounce
		if self._last_button_press + datetime.timedelta(0,0.3) < datetime.datetime.now():
			self._last_button_press = datetime.datetime.now()
			if channel == config.thermos_gpio_mode_button:
				if self._mode == None or self._mode == "schedule":
					self._mode = "manual"
				elif self._mode == "manual":
					self._mode = "off"
				else:
					self._mode = "schedule"
				self._info("mode changed by button press to "+str(self._mode))
				self._config_needs_saving = True
				self._status_changed = True
			
			elif channel == config.thermos_gpio_up_button or channel == config.thermos_gpio_down_button:
				if channel == config.thermos_gpio_up_button:
					inc = 1
				else:
					inc = -1
				self._manual_temperature = self._manual_temperature + inc
				self._info("manual temperature changed button press to "+str(self._manual_temperature))
				self._config_needs_saving = True
				self._status_changed = True
			
	def run(self):
		
		self._info("\n\n")
		self._info("starting Thermos")
	
		#initialise what should be initialised.
		self._setup_hardware()
				
		#load schedule
		self._schedule = Schedule(filename=self._schedule_filename)
		
		#and run for ever
		try: 
			while self._should_run():
				
				#handle button presses
				if self._config_needs_saving:
					self._config_needs_saving = False
					self._write_config()
					
				#check if config or schedule should be reloaded 	
				self._reload_config()
				self._schedule.reload()
				
				#get schedule entry
				active_schedule_entry =  self._schedule.get_active_entry()
				if self._active_schedule_entry != active_schedule_entry:
					self._active_schedule_entry = active_schedule_entry
				
				self._read_current_temperature()
				self._update_heating()
				
				#update only when needed
				if self._status_changed:
					self._status_changed=False
					self._log_status()
					self._write_status()
					self._update_hardware()
					
				#write status every n minutes anyways.
				if self._last_status_written + datetime.timedelta(0,60*config.thermos_status_update_interval) < datetime.datetime.now():
					self._write_status()
			
				if self._last_stats_written + datetime.timedelta(0,60*config.thermos_stats_interval) < datetime.datetime.now() or self._stats_needs_saving:
					self._write_stats()
					self._stats_needs_saving = False
					
				time.sleep(config.thermos_update_interval)
		
		except KeyboardInterrupt: 
			self._info("keyboard interrupt, exiting.")
			self._cleanup_hardware()
		except:
			self._error("error")
			
			
	@property
	def _scheduled_temperature(self):
		if self._mode == "manual":
			if self._manual_temperature==None:
				return 0
			else:
				return self._manual_temperature
		elif self._mode == "schedule":
			if self._active_schedule_entry == None:
				return 0 
			else:
				return self._active_schedule_entry.temperature
		else:
			return 0
	
	def _should_run(self):
		return True
		
	def _reload_config(self):
		if(self._config_filename != None):
			
			
			if self._config_file_date==None or self._config_file_date != os.path.getmtime(self._config_filename):
				try:
					self._info("loading config from '"+self._config_filename+"'")
					self._load_config()
				except Exception:
					self._error("could not reload config file '"+self._config_filename+"'")
					traceback.print_exc()
					

	def _load_config(self):
		json_file = open(self._config_filename)
		json_data = json.load(json_file)
		json_file.close()
		if "mode" in json_data and (self._mode == None or self._mode != json_data["mode"]):
			self._info("mode changed to "+json_data["mode"]+" (was "+str(self._mode)+")")
			self._mode = json_data["mode"]
			self._status_changed = True
		if "manual_temperature" in json_data and (self._manual_temperature == None or self._manual_temperature != float(json_data["manual_temperature"])):
			self._info("manual temperature changed to "+str(json_data["manual_temperature"])+" (was "+str(self._manual_temperature)+")")
			self._manual_temperature = float(json_data["manual_temperature"])
			self._status_changed = True
		self._config_file_date = os.path.getmtime(self._config_filename)#datetime.datetime.now()


	def _write_config(self):
		try:
			out = "{"
			i = 0
			if self._mode!=None:
				out = out + "\n\t\"mode\":\""+self._mode+"\""
				i = i+1
			if self._manual_temperature!=None:
				if i>0:
					out = out + ","
				out = out + "\n\t\"manual_temperature\":"+str(self._manual_temperature)
			out = out + "\n}"
			self._info("writing config to '"+self._config_filename+"'")
			f = open(self._config_filename,'w')
			f.write(out)
			f.close()
			self._config_file_date != os.path.getmtime(self._config_filename)
		except Exception:
			self._error("could not write config to '"+self._config_filename+"'")
			traceback.print_exc()
		
		
	def _update_heating(self):			
		if self._mode == "manual" or self._mode == "schedule":
			if self._current_temperature() + config.thermos_margin <= self._scheduled_temperature and (not self._heating or self._heating == None):
				self._heating = True
				self._status_changed = True
			if self._current_temperature() >= self._scheduled_temperature + config.thermos_margin and (self._heating or self._heating == None):
				self._heating = False
				self._status_changed = True
		else:
			if self._heating or self._heating == None:
				self._heating = False
				self._status_changed = True
				
	def _current_temperature(self):
		for key in self._current_temperatures.keys():
			return self._current_temperatures[key]
							
	def _read_current_temperature(self):
		try:
			if len(self._temperature_sensor_device_files.keys())>0:
				for key in self._temperature_sensor_device_files.keys():
					f = open(self._temperature_sensor_device_files[key], 'r')
					lines = f.readlines()
					f.close()
					while lines[0].strip()[-3:] != 'YES':
						time.sleep(0.2)
						lines = read_temp_raw()
					equals_pos = lines[1].find('t=')
					if equals_pos != -1:
						temp_string = lines[1][equals_pos+2:]
						temp_c = float(temp_string) / 1000.0
						self._current_temperatures[key] = temp_c
						#self._info("read temperature "+key+" :"+str(temp_c))
			else:
				r = 0.1 * (0.5-random.random())
				if len(self._current_temperatures.keys())==0:
					self._current_temperatures["main"] = 19
				if self._current_temperatures["main"]+r > 15 and self._current_temperatures["main"]+r < 25:
					self._current_temperatures["main"] = self._current_temperatures["main"] + r
		except:
			self._error("could not read temperature from sensor.")
			traceback.print_exc()
			

	def _update_hardware(self):
		
		if THERMOS_HAS_GPIO:
			if self._heating!=None and self._heating:
				GPIO.output(config.thermos_gpio_heating_led,GPIO.HIGH)
			else:
				GPIO.output(config.thermos_gpio_heating_led,GPIO.LOW)
		
			if self._mode=="off" or self._mode==None:	
				GPIO.output(config.thermos_gpio_schedule_led,GPIO.LOW)
				GPIO.output(config.thermos_gpio_manual_led,GPIO.LOW)
			elif self._mode=="manual":	
				GPIO.output(config.thermos_gpio_schedule_led,GPIO.LOW)
				GPIO.output(config.thermos_gpio_manual_led,GPIO.HIGH)
			else:
				#schedule
				GPIO.output(config.thermos_gpio_schedule_led,GPIO.HIGH)
				GPIO.output(config.thermos_gpio_manual_led,GPIO.LOW)
			

	def _write_status(self):
		try:
			out = "{"
			if(self._heating):
				out = out + "\n\t\"heating\":true,"
			out = out + "\n\t\"current_temperatures\": {"
			i = 0;
			for key in self._current_temperatures.keys():
				if i>0:
					out = out + ","
				i = i+1
				out = out + "\""+key+"\":\""+str(self._current_temperatures[key])+"\""
			out = out + "},"
			out = out + "\n\t\"mode\":\""+str(self._mode)+"\","
			out = out + "\n\t\"scheduled_temperature\":"+str(self._scheduled_temperature)+""
			if self._active_schedule_entry!=None:
				out = out + ",\n\t\"active_schedule_entry\":"+str(self._active_schedule_entry.to_json())
			out = out + "\n}"
			f = open(self._status_filename,'w')
			f.write(out)
			f.close()
			self._last_status_written = datetime.datetime.now()
		except:
			self._error("could not write status file")
			traceback.print_exc()
		
		
	def _log_status(self):
		t = ""
		i=0
		for key in self._current_temperatures.keys():
			if i>0:
				t = t + ", "
			i = i+1
			t = t + key+":"+str(self._current_temperatures[key])
			
		self._info("mode:"+str(self._mode)+" - temperatures: "+t+" - target:"+str(self._scheduled_temperature)+" - heating:"+str(self._heating)+" - active schedule : " + str(self._active_schedule_entry))

	def _write_stats(self):
		self._last_stats_written=datetime.datetime.now()
		
		mode = 0
		if(self._mode=="manual"):
			mode = 1
		if(self._mode=="schedule"):
			mode = 2

		out = ""
		for key in self._current_temperatures.keys():
			out = out + "\t" + str(self._current_temperatures[key])
				
		heating = 0
		if(self._heating!=None):
			if(self._heating):
				heating = 1

		scheduled_temperature = 0
		if(self._scheduled_temperature != None):
			scheduled_temperature = self._scheduled_temperature

		time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
		date = datetime.datetime.now().strftime("%Y-%m")
		stat_file = open("data/stats-"+date+".log", "a")
		ts = '%i' % self.unix_time_millis(datetime.datetime.now())
		stat_file.write(ts +"\t"+str(mode)+"\t"+str(heating)+"\t"+str(scheduled_temperature)+out+"\n")
		stat_file.close()

	def unix_time(self,dt):
	    epoch = datetime.datetime.utcfromtimestamp(0)
	    delta = dt - epoch
	    return delta.total_seconds()

	def unix_time_millis(self,dt):
	    return self.unix_time(dt) * 1000.0
	
if __name__ == '__main__':
	thermos = Thermos()
	thermos.run()
