const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth');
const db = require('./queries');
const bcrypt = require('bcrypt');
var cors = require('cors');

const promClient = require('prom-client');


var date = new Date();

// DB Config
const Pool = require('pg').Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

// Route Decleration
const userRoutes = require('./api/routes/user');
const recipeRoutes = require('./api/routes/recipe');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(function (req, res, next) {    
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use('/v1/user', userRoutes);
app.use('/v1/recipe', recipeRoutes);
//app.use(cors({
   // 'Access-Control-Allow-Origin': 'http://localhost:3001',
//}));


var auth = (request, response, next) => {
    var user = basicAuth(request);
    if(!user || !user.name || !user.pass){
      response.set('WWW-Authenticate', 'Basic realm=User not logged in');
      response.status(401).json({response:{
          message: "You are not logged in"
          }
      }).send();
    }
    else{
      db.getUser(user.name, function(data){
          if(data.length <=0){
              //in the database if there are is an item not saved the lenght is 0
              response.status(401).json({response:{
                  message: "Invalid Credentials"
              }});
          }
          else{
              var userPassHash = data[0].password;
              if(bcrypt.compareSync(user.pass, userPassHash)){
                  next();
              }
              else{
                  response.status(401).json({response:{
                      message: "Invalid Credentials"
                  }});
              }
          }
      });
      
    }
  }

  app.get('/', (request, response) => { 
    //!!!whenever hitting base URL, always send a response back
   
     response.status(200).json({response: {
       message: "Authenticated at " + date.toLocaleTimeString()
   }});  
   response.end();
    
          //else server will get hung up
 });

 // to check for the health
 app.get('/health', (request, response) => { 
    //!!!whenever hitting base URL, always send a response back

   
     response.status(200).json("successful");  
   response.end();
          //else server will get hung up
 });

 app.get('/metrics', (request, response) => {
    response.set('Content-Type', promClient.register.contentType)
    response.end(promClient.register.metrics())
});

promClient.collectDefaultMetrics();

app.use((req, res, next) =>{
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});


app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});


module.exports = app;
