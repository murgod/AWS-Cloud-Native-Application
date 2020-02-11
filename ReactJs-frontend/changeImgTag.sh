#!/bin/bash

rev=$(git rev-parse HEAD)
echo $rev

sed "s/a195188554c19a2fd849cec9c0ac08a2ca97f790/$rev/g" Deployment.yaml > Deployment_live.yaml 

