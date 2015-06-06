
#Thermos is programable thermostat running on Raspberry PI.

Web app using Node.JS and React JS to control Thermos remotely and modify the schedule.

Hardware buttons to change mode (auto, manual, off), increase and decrease manual temperature.

##Requirements
- Raspberry Pi (Any model should do)
- Python. comes pre installed on Raspian
- NodeJS, NPM and some NPM dependencies. See installation below.
- Some electronics : leds, push buttons, thermal sensor, bread board, resistors. modmypi.com has a kit that provides most of what you need : https://www.modmypi.com/raspberry-pi-youtube-workshop-kit
- A relay : connected to the led indicating heating, to control your heating or whatever electrical device you fancy. http://store.arduino.cc/product/T010010

## Installation
### thermos
Just copy the content of the repository somewhere on your pi.

### Node JS
do not install node js from debian repo. Debian is well known to have outdated packages. Follow the instruction below instead.
Install Node JS from : http://weworkweplay.com/play/raspberry-pi-nodejs/
```
wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb
rm node_latest_armhf.deb
```
### NPM
#### Install NPM
`sudo apt-get update && sudo apt-get upgrade && sudo apt-get install npm`
#### Install NPM dependencies
Install dependencies using npm.
from `nodejs` directory run :
`npm install`


##Hardware setup 
The hardware setup is very simple : three push buttons, three leds, some resitors and thermal sensor.
 
all of which is described in https://www.modmypi.com/raspberry-pi-youtube-workshop-kit
	
##Start Thermos
run `./start.sh`

##Stop Thermos
not very clean but does the job : `./stop.sh`

##Start Thermos at boot time :
add to `/etc/rc.local` : `/bin/bash /home/pi/thermos/start.sh &`

##Access the Web App
http://my-raspberry-pi:8080/

login and password are hardcodes in `nodejs/node.js`

##Files
- `nodejs/` : rest api and web app.
- `Thermos.py` : the actual program
- `Schedule.py` : customisable scheduler.
- `config.py` : configuration of the software : gpios etc.
- `data/config.json` :  living configuration of thermos : mode, manual temperature
- `data/schedule.json` : your schedule (edited via the web ui)
- `data/status.json` : status of thermos (temperature, mode etc)
	
