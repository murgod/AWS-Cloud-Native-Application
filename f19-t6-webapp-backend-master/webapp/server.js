const envVars = require('dotenv').config();
//creates a new server
const http = require('http');
const app = require('./app');

if(envVars.error){
  throw envVars.error
}
console.log(envVars.parsed);

var NODE_ENV = process.env.NODE_ENV;
var PORT = process.env.PORT;
var DB_HOST = process.env.DB_HOST;
var DB_USER = process.env.DB_USER;
var DB_PASS = process.env.DB_PASS;
var DB_PORT = process.env.DB_PORT;
var DB_NAME = process.env.DB_NAME;
var BUCKET_NAME = process.env.BUCKET_NAME;
var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var SECRET_ACCESS_KEY_ID = process.env.SECRET_ACCESS_KEY_ID;

const server = http.createServer(app);
server.listen(PORT);

console.log('Server is running with NODE_ENV:', (NODE_ENV));
console.log('Server is running with PORT:', (PORT));
console.log('Server is running with DB_HOST:', (DB_HOST));
console.log('Server is running with DB_USER:', (DB_USER));
console.log('Server is running with DB_PASS:', (DB_PASS));
console.log('Server is running with DB_PORT:', (DB_PORT));
console.log('Server is running with DB_NAME:', (DB_NAME));
console.log('Server is running with BUCKET_NAME:', (BUCKET_NAME));
console.log('Server is running with AWS_ACCESS_KEY_ID:', (AWS_ACCESS_KEY_ID));
console.log('Server is running with SECRET_ACCESS_KEY_ID:', (SECRET_ACCESS_KEY_ID));
