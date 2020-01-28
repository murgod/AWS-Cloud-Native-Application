#!/bin/bash

rev=$(git rev-parse HEAD)
echo $rev

sed "s/8922c696f528616fb5c75946ee38d00d658c7f85/$rev/g" Deployment.yaml > Deployment_live.yaml 

