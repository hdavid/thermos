#!/bin/bash
THERMOS_HOME="/home/pi/thermos"

mkdir -p $THERMOS_HOME/logs
mkdir -p $THERMOS_HOME/data

cd $THERMOS_HOME
/usr/bin/python $THERMOS_HOME/Thermos.py & 

cd $THERMOS_HOME/nodejs/
/usr/local/bin/node $THERMOS_HOME/nodejs/node.js &>> $THERMOS_HOME/logs/restApi.log  &

exit 0
