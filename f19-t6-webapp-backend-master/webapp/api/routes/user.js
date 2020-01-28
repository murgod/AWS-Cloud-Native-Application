const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
var saltRounds = process.env.SALT_ROUNDS;
const bodyParser = require('body-parser');

var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
var emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

const db = require("../../queries.js");
const usrcommon = require("./user_common");

const prometheusClient = require('prom-client');

// post-user prometheus client 
const POST_userCounter = new prometheusClient.Counter({
    name: 'POST_User',
    help: 'POST_User_help'
  });

// post-user prometheus client 
const GET_USERCounter = new prometheusClient.Counter({
    name: 'GET_User',
    help: 'GET_User_help'
  });


module.exports = router;

// get user
router.route("/self").get((req,res) => {
    
    GET_USERCounter.inc();

    usrcommon.validateBasicAuth(req,res, function(userId){

        db.getUserById(userId, function(result){
            res.status(200).json(result).send();
        });
    });

});

// register user
router.route("/").post((req,res) => {

    POST_userCounter.inc();
    
    //Storing the data passed through the body
    console.log("Hi"); 
    console.log(JSON.stringify(req.body)); 
    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email_address = req.body.email_address;

    console.log(password);
    console.log(first_name);
    console.log(last_name);
    console.log(email_address);
    

    if(!(email_address && password && first_name && last_name)){
        console.log("Hi"); 
        res.status(400).json({response:{
            message: "Enter password properly"
        }}).send();
    }

    else{

    validateEmail(email_address, function(isValidEmail){
        if(!isValidEmail){
            res.status(422).json({response:{
                message: "Not a valid email address"
            }});
        }
        else{

            //Function call for validating the password strength
            validatePassword(password, function(data){
                
                if(data=="invalid"){
                    res.status(422).json({response:{
                        message: "Weak password according to NIST standard"
                    }});
                }
                else{
                    db.getUser(email_address, function(result){
                        //console.log("After the query");
                        if(result.length >= 1){
                            res.status(409).json({response:{
                                message:"User already exists"
                            }}).send();
                            
                        }
                        else{
                            passwordToHash(password, function(hash){
                                db.createUser(uuidv4(),email_address,hash,first_name, last_name, function(result){
                                    if(result){
                                        res.status(201).json({response:{
                                            message: "User registered successfully"
                                        }}).send();

                                    }
                                    else{
                                        res.status(500).json({response:{
                                            message: "Something went wrong, please try again"
                                        }}).send();
                                    }
                                    
                                });
                            });
                        }
                    
                    });
                }
            });
        }
    });

    }
});

// update user details
router.route("/self").put((req,res) => {

    console.log("Hi"); 
    //Storing the data passed through the body
    console.log(JSON.stringify(req.body)); 
    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;

    if(!(password && first_name && last_name)){
        res.status(400).json({response:{
            message: "Enter password "
        }}).send();
    }
    else{
        usrcommon.validateBasicAuth(req,res, function(userId){

            passwordToHash(password, function(passwordHash){

                db.updateUser(first_name, last_name,passwordHash, userId, function(result){
                    console.log(" after update")
                    //console.log(JSON.stringify(result));

                    if(result.rowCount >= 1){

                        db.getUserById(userId, function(result){
                            res.status(200).json(result).send();
                        });
                    }
                    else
                    {
                        res.status(204).send();
                    }
                });
            });
        });
    }
});


var validateEmail = (email_address,callback) => {
    let isValidEmail = emailRegex.test(email_address);
    if(isValidEmail){
        callback(true);
    }
    else{
        callback(false);
    }
}

var validatePassword = (password,callback) => {
    var decision = strongRegex.test(password);
    if(decision){
        callback("valid");
    }
    else{
        callback("invalid");
    }
}

var passwordToHash = (password, callback) => {
    //Generating the salt
    var salt = bcrypt.genSaltSync(Number(saltRounds));
    //Generating hash for the password passed
    var hash = bcrypt.hashSync(password, salt);

    callback(hash);
}
