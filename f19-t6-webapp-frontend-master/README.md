# f19-t6-webapp-frontend


# Steps to run webapp through npm:

cd f19-t6-webapp-frontend/webapp

```
  To install dependencies : npm install
  To start App : npm start
  
  http:\\localhost:3000
```





# Build and run on Docker within local system

*build docker image*
```
docker build -t react:app .
```
*run docker image*
```
docker run -t react:app
```


# Build and run docker through docker-compose orchestrator
```
docker-compose up
```

# Build and run on Docker with CircleCI

*Connect to Docker*
```
docker login --username=akmurgo
```
*Pull image from docker*
```
docker pull akmurgod/f19-t6-webapp-frontend:b416615057fc5d69737bd7f145f6dd9f30bf1cd7
```
*Run docker image*
```
docker run -p 3000:3000 -t akmurgod/f19-t6-webapp-frontend:b416615057fc5d69737bd7f145f6dd9f30bf1cd7
```

