const bcrypt = require('bcrypt');
const basicAuth = require('basic-auth');
const db = require("../../queries");

var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
var emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);


// function to validate basic auth
var validateBasicAuth = (req,res, callback) => {
    let user = basicAuth(req);
    if(!user || !user.name || !user.pass){
        res.set('WWW-Authenticate', 'Basic realm=User not logged in');
        res.status(401).json({response:{
            message: "You are not logged in"
            }
        }).send();
    }
    else{
        db.getUser(user.name, function(data){
            if(data.length <=0){
                //in the database if there are is an item not saved the lenght is 0
                res.status(401).json({response:{
                    message: "Invalid Credentials"
                }}).send();
            }
            else{
                var userPassHash = data[0].password;
                if(bcrypt.compareSync(user.pass, userPassHash)){
                    callback(data[0].id);
                }
                else{
                    res.status(401).json({response:{
                        message: "Invalid Credentials"
                    }});
                }
            }
        });
      }
};


var validateEmail = (email_address,callback) => {
    let isValidEmail = emailRegex.test(email_address);
    //console.log("This is the decision"+ decision);
    if(isValidEmail){
        callback(true);
    }
    else{
        callback(false);
    }
}

var validatePassword = (password,callback) => {
    //console.log(strongRegex);
    //console.log("This is pass",password);
    var decision = strongRegex.test(password);
    //console.log("This is the decision"+ decision);
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


module.exports = {
    validateBasicAuth,
    validateEmail,
    passwordToHash,
    validatePassword
}