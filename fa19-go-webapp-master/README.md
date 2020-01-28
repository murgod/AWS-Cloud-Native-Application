**fa19-go-webapp**


Go Repo for CSYE7374


**1. pre-requisites**

1.1. Install Go.
```
   - $ brew update
   - $ brew install golang
   
   set env variables:
   - export GOPATH=$HOME/path/to/fa19-go
   - export GOROOT=/usr/local/opt/go/libexec
 ```      
 - [Go setup on mac-osX](https://sourabhbajaj.com/mac-setup/Go/README.html).

1.2. Install Gorilla/mux
```
   - go get github.com/gorilla/mux
```
1.3. Install Docker.
        
1.4. Setup Circle CI
     - [CircleCI-WithDocker](https://circleci.com/blog/using-circleci-workflows-to-replicate-docker-hub-automated-builds/).

1.5. Setup Dockerhub.


**2. Instructions to run** 

2.1. Export (OpenWeather)API key.
```    
    export API_KEY=XXXXXXXX89aefd20896f0732XXXXXXXX
```    
2.2. Compile and run go application
```
    go run main.go
```
2.3. Call api endpoint [http://your-host-or-ip/current/<cityname>]
```         
   http://localhost:8080/current/boston
```  

**3. Instructions to run webapp as a container** 

The CI/CD workflow in this project builds docker image from 'Dockerfile deploys it onto Dockerhub. Pull is needed from Dockerhub to fetch and run the dockerimage.

-Login to docker
```
    docker login --username=akmurgod
```

-Pull docker image
```
   docker pull <DOCKER_HUB_USER>/IMG:TAG
   docker pull akmurgod/fa19-go-webapp:30410c9823ff8d2400f919cc58fbaa32633b9378 
```

-Run docker container.
```
    docker run -t -p 11080:8080 akmurgod/go-weather-api:latest
    docker run -t -e "API_KEY"="XXXXX352f89aefd20896f073XXXXXX" -p 11080:8080 docker_user_name/Docker_image_name:TAG
```
-Call api endpoint [http://your-host-or-ip/current/<cityname>]
```         
   http://localhost:11080/current/boston
``` 

**References**
- Docker ENV variables [https://vsupalov.com/docker-arg-env-variable-guide/]

  
