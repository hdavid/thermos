
Thermos is programable themostat running on Raspberry PI.


Web app using Fask and React JS to control Thermos remotely and modify the schedule
Hardware buttons to change mode (auto, manual, off), increase and decrease manual temperature

Requirements :
	Raspberry Pi (A or B)
	Python. comes pre installed on Raspian)
	Flask : Python Rest API. to install it run  sudo pip install flask
	Some electronics : leds, push buttons, thermal sensor, bread board, resistors. www.modmypi.co.uk has a kit that provide most of what you need : https://www.modmypi.com/raspberry-pi-youtube-workshop-kit
	A relay : connected to the led indicating heating, to control your heating or whatever eletrical device you fancy. http://store.arduino.cc/product/T010010

Hardware setup : 
	the hardware setup is very simple : three buttons, three leds, and thermal sensor. 
	all of which is described in https://www.modmypi.com/raspberry-pi-youtube-workshop-kit
	
Run It :
	sudo thermos/start.sh

Start Thermos at boot time :
	add to /etc/rc.local : /bin/bash /home/pi/thermos/start.sh &

Stop Thermos :
	not very clean but does the job : sudo killall python

Acces the Web App:
	http://my-raspberry-pi:8080/
	login and password are configured in config.py

Files :
	RestApi.py : rest api and web app.
	Thermos.py : the actual program
	Schedule.py : customisable scheduler.
	config.py : configuration of the software : gpios etc.
	config.json :  living configuration of thermos : mode, manual temperature
	schedule.json : your schedule (edited via the web ui)
	status.json : status of thermos (temperature, mode etc)
	
