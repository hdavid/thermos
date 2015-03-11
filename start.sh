#!/bin/bash
THERMOS_HOME="/home/pi/thermos"

sudo mkdir -p $THERMOS_HOME/logs
sudo mkdir -p $THERMOS_HOME/data

cd $THERMOS_HOME
sudo /usr/bin/python $THERMOS_HOME/Thermos.py & 

cd $THERMOS_HOME/nodejs/
sudo /usr/local/bin/node $THERMOS_HOME/nodejs/node.js &>> $THERMOS_HOME/logs/restApi.log  &

exit 0
