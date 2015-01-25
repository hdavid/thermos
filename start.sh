#!/bin/bash
THERMOS_HOME="/home/pi/thermos"

cd $THERMOS_HOME
/usr/bin/python $THERMOS_HOME/Thermos.py & 

cd $THERMOS_HOME/nodejs/
/usr/local/bin/node $THERMOS_HOME/nodejs/node.js &>> $THERMOS_HOME/restApi.log  &

exit 0
