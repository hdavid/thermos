#!/bin/bash
cd /home/pi/thermos
/usr/bin/python /home/pi/thermos/RestApi.py &>> /home/pi/thermos/restApi.log  &
/usr/bin/python /home/pi/thermos/Thermos.py & 
#&>> /home/pi/thermos/thermos.log  &
exit 0
