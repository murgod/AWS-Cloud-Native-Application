const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
var saltRounds = process.env.SALT_ROUNDS;
const multer = require('multer');
const fs = require('fs');
const aws = require('aws-sdk');
const uploadFolder = './uploads/'
const s3Upload = require('../../services/image-upload');
const s3singleUpload = s3Upload.upload.single('attachment');
const usrcommon = require("./user_common");

// for elastic search
const { Client } = require('@elastic/elasticsearch')
const elastic_service = 'http://' + process.env.ELASTIC_HOST;
console.log("process.env.ELASTIC_HOST : " + process.env.ELASTIC_HOST);
console.log("Elastic load balancer url :" + elastic_service);
const esClient = new Client({ node: elastic_service })
const prometheusClient = require('prom-client');

// 
const POST_recipeCounter = new prometheusClient.Counter({
    name: 'POST_recipe',
    help: 'POST_recipe_help'
  });

// GET recipe counter 
const GET_recipeCounter = new prometheusClient.Counter({
    name: 'GET_recipe',
    help: 'GET_recipe_help'
  });

var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
var emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

const db = require("../../queries.js");
const recipeCommon = require("./recipe_common");


const storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, uploadFolder);
    },
    filename: function(req,file,callback){
        callback(null, Date.now() + file.originalname);
    }

}); 
const upload = multer({storage:storage}).array('attachment',1);

module.exports = router;


// add recipe
router.route("/").post((req,res) => {

    POST_recipeCounter.inc();

    let cook_time_in_min = req.body.cook_time_in_min;

    let prep_time_in_min = req.body.prep_time_in_min;
    let title = req.body.title;
    let cuisine = req.body.cuisine;
    let servings = req.body.servings;

    let ingredients = req.body.ingredients;
    let steps = req.body.steps;
    let nutrition_information = req.body.nutrition_information;
    // to check if user is looged in or not
    usrcommon.validateBasicAuth(req, res, function(userId) {

        if (!(cook_time_in_min && prep_time_in_min && title && cuisine && servings && ingredients && steps && nutrition_information)) {
            res.status(400).json({
                response: {
                    message: "Bad request"
                }
            }).send();
        }
        else {
            let total_time_in_min = cook_time_in_min + prep_time_in_min;
            let recipe_id = uuidv4();
            db.createRecipe(recipe_id, userId, cook_time_in_min, prep_time_in_min,total_time_in_min, title, cuisine, servings, function (result) {

                if (result) {

                    // Iterating over steps
                    for (i = 0; i < steps.length; i++) {
                        let position = steps[i].position;
                        let items = steps[i].items;

                        // adding steps to db
                        db.addSteps(recipe_id, position,items, function (steps_result) {
                        });
                    }

                    // adding ingredients
                    for (i = 0; i < ingredients.length; i++) {

                        // adding steps to db
                        db.addIngredients(recipe_id, ingredients[i], function (ingredients_result) {
                        });
                    }

                    let calories = nutrition_information.calories;
                    let cholesterol_in_mg = nutrition_information.cholesterol_in_mg;
                    let sodium_in_mg = nutrition_information.sodium_in_mg;
                    let carbohydrates_in_grams = nutrition_information.carbohydrates_in_grams;
                    let protein_in_grams = nutrition_information.protein_in_grams;

                    // adding nutrition
                    db.addNutrition(recipe_id,calories,sodium_in_mg,carbohydrates_in_grams, cholesterol_in_mg,  protein_in_grams, function (nutrition_result) {
                        db.getRecipiesById(recipe_id , function(recipe_data){

                            if(recipe_data.length <= 0){
                                res.status(404).json();
                            }
                            else
                            {
                                fetchOtherData(recipe_data, function(all_recepies_data){
                                    const timeoutObj = setTimeout(() => {
                                        // callback API
                                        esClient.index({
                                            index: 'recipe',
                                            id: all_recepies_data[0].id,
                                            type: 'mytype',
                                            body: all_recepies_data[0],
                                        }, (err, result) => {
                                            if(err)
                                                console.log(err);
                                                //res.status(500).send("Problem with elastic cluster");
                                            
                                                res.status(201).send(all_recepies_data[0]);
                                            
                                        })
                                        //res.status(201).send(all_recepies_data[0]);
                                      }, 500);
                                    
                                });
                            }   
                        })
                    });


                    //res.status(201).send(result);
                }
            });
        }
    });
});

// get all recipies
router.route("/").get((req,res) => {

    GET_recipeCounter.inc();
        // usrcommon.validateBasicAuth(req, res, function(userId) {

            db.getAllRecipies(function (all_recepies) {
                if(all_recepies.length > 0){
                fetchOtherData(all_recepies, function(all_recepies_data){
                    const timeoutObj = setTimeout(() => {
                        res.status(200).send(all_recepies_data);
                      }, 500);
                    
                });
            }
            else{
                res.status(404).send();
            }
                
            });

        //});
    });

    var fetchOtherData = (all_recepies, callback) => {
        let isdone = false;
        for (let recepiesCount  = 0; recepiesCount < all_recepies.length; recepiesCount++) {

            db.fetchNutritionInformation( all_recepies[recepiesCount].id, function (nutrition_result) {

                all_recepies[recepiesCount]["nutrition_information"]  = nutrition_result;

                db.fetchSteps( all_recepies[recepiesCount].id, function (steps_result) {

                    all_recepies[recepiesCount]["steps"]  = steps_result;
    
                    db.fetchIngredients( all_recepies[recepiesCount].id, function (ingredients_result) {
                        

                        recipeCommon.getImagesByRecipeId(all_recepies[recepiesCount].id , function (image_results) {
                            all_recepies[recepiesCount]["image"] = image_results;

                                let ingredientsArray = [];
                                
                                for (j = 0; j < ingredients_result.length; j++) {
                                    ingredientsArray.push(ingredients_result[j].items)
                                }
                
                                all_recepies[recepiesCount]["ingredients"]  = ingredientsArray;
                        })
                        
                    });
                    
                });
            });
            if(recepiesCount ==  all_recepies.length -1)
                isdone = true;
        }

        if(isdone)
        callback(all_recepies);

    }

    // delete user recipe
    router.route('/:id').delete((req,res) => {
        let id = req.params.id;

        usrcommon.validateBasicAuth(req,res, function(userId){
            db.getRecipiesById(id , function(recipe_data){

                if(recipe_data.length <= 0){
                    res.status(404).json({response:{
                        message: "Bad Request"
                    }})
                }
                else
                    if(recipe_data.length > 0 &&  recipe_data[0].author_id == userId){
                        db.deleteRecipe(id , function(results){ 
                            if(results['rowCount'] == 0){
                                res.status(404).send();
                            }
                            else{
                                db.deleteSteps(id , function(results){ 

                                    db.deleteNutritionInformation(id , function(results){ 

                                        db.deleteIngredients(id , function(results){ 

                                            esClient.delete({
                                                index: 'recipe',
                                                id: id,
                                                type: 'mytype'
                                            }, (err, result) => {
                                                
                                                    if(err)
                                                    console.log(err);
                                                    //res.status(500).send("Problem with elastic cluster");
                                                
                                                    res.status(204).json({response:{
                                                        message: "Delete Sucessfull"
                                                    }});
                                                
                                            })
                                            
                                        });
    
                                    });

                                });
                                
                            }   
                        });
                    }
                    else
                    {
                        res.status(401).json({response:{
                            message: "Unauthorized"
                        }})
                    }   
            })
        });
    });


    // delete user recipe
    router.route('/:id').get((req,res) => {
        let id = req.params.id;


            db.getRecipiesById(id , function(recipe_data){

                if(recipe_data.length <= 0){
                    res.status(404).json();
                }
                else
                {
                    fetchOtherData(recipe_data, function(all_recepies_data){
                        const timeoutObj = setTimeout(() => {
                            res.status(200).send(all_recepies_data);
                          }, 500);
                        
                    });
                }   
            })
    });

    // PUT method for recipe API
    router.route('/:id').put((req,res) => {
        let id = req.params.id;

        usrcommon.validateBasicAuth(req,res, function(userId){

            db.getRecipiesById(id , function(recipe_data){

                if(recipe_data.length <= 0){
                    res.status(404).json({response:{
                        message: "Bad Request"
                    }})
                }
                else{

                    if(recipe_data.length > 0 &&  recipe_data[0].author_id == userId){
                       
                        let cook_time_in_min = req.body.cook_time_in_min;

                        let prep_time_in_min = req.body.prep_time_in_min;
                        let title = req.body.title;
                        let cuisine = req.body.cuisine;
                        let servings = req.body.servings;
                    
                        let ingredients = req.body.ingredients;
                        let steps = req.body.steps;
                        let nutrition_information = req.body.nutrition_information;

                        if (!(cook_time_in_min && prep_time_in_min && title && cuisine && servings && ingredients && steps && nutrition_information)) {
                            res.status(400).json({
                                response: {
                                    message: "Provide valid input"
                                }
                            }).send();
                        }
                        else {
                                
                                    let total_time_in_min = cook_time_in_min + prep_time_in_min;
                                    let recipe_id = id;
                                    db.updateRecipe(recipe_id, userId, cook_time_in_min, prep_time_in_min,total_time_in_min, title, cuisine, servings, function (result) {

                                        db.deleteSteps(id , function(results){ 

                                            db.deleteNutritionInformation(id , function(results){ 

                                                db.deleteIngredients(id , function(results){ 
                                                    // Iterating over steps
                                                    for (i = 0; i < steps.length; i++) {
                                                        let position = steps[i].position;
                                                        let items = steps[i].items;

                                                        // adding steps to db
                                                        db.addSteps(recipe_id, position,items, function (steps_result) {
                                                        });
                                                    }

                                                    // adding ingredients
                                                    for (i = 0; i < ingredients.length; i++) {

                                                        // adding steps to db
                                                        db.addIngredients(recipe_id, ingredients[i], function (ingredients_result) {
                                                        });
                                                    }

                                                    let calories = nutrition_information.calories;
                                                    let cholesterol_in_mg = nutrition_information.cholesterol_in_mg;
                                                    let sodium_in_mg = nutrition_information.sodium_in_mg;
                                                    let carbohydrates_in_grams = nutrition_information.carbohydrates_in_grams;
                                                    let protein_in_grams = nutrition_information.protein_in_grams;
                                
                                                    // adding nutrition
                                                    db.addNutrition(recipe_id,calories,sodium_in_mg,carbohydrates_in_grams, cholesterol_in_mg,  protein_in_grams, function (nutrition_result) {
                                                        
                                                        
                                                        
                                                        db.getRecipiesById(id , function(recipe_data){

                                                            if(recipe_data.length <= 0){
                                                                res.status(404).json();
                                                            }
                                                            else
                                                            {
                                                                fetchOtherData(recipe_data, function(all_recepies_data){
                                                                    const timeoutObj = setTimeout(() => {
                                                                        esClient.index({
                                                                            index: 'recipe',
                                                                            id: all_recepies_data[0].id,
                                                                            type: 'mytype',
                                                                            body: all_recepies_data[0],
                                                                        }, (err, result) => {
                                                                            if(err)
                                                                                console.log(err);
                                                                                //res.status(500).send("Problem with elastic cluster");
                                                                            
                                                                                res.status(200).send(all_recepies_data);
                                                                            
                                                                        })
                                                                      }, 500);
                                                                    
                                                                });
                                                            }   
                                                        })
                                                    });
                                                                    
                                                });

                                            });

                                        });
                                });
                    }
                }
                else
                {
                    res.status(401).json({response:{
                        message: "Unauthorized"
                    }})
                }
            }
        });
        
    });
});


// API for attaching image in recipe
router.route('/:recipe_id/image').post((req, res) => {
  
    let recipe_id = req.params.recipe_id;
    usrcommon.validateBasicAuth(req, res , (user_id) =>{
        console.log("user_id : " + user_id);

    recipeCommon.isUserAuthorized(recipe_id,user_id,req,res, (isAuth) => {
        if(isAuth == "Authorized"){
            
            s3singleUpload(req, res, (err) =>{
              if(err){
                throw err
              }
              else{
                let imageUrl = req.file.location;
                let fileName = imageUrl.split('/').pop().replace(/%20/g, " ");
               recipeCommon.addImageDataToDB(recipe_id, req, res, imageUrl, fileName);
              }
            });

        }
      });
    });
  
  });

  // API to get image details based on recipe_id and image_id
router.route('/:recipe_id/image/:image_id').get((req, res) => {
  
    let recipe_id = req.params.recipe_id;
    let image_id = req.params.image_id;
    recipeCommon.getImageByID(recipe_id, image_id, res);

  });

    // API to get image details based on recipe_id and image_id
router.route('/:recipe_id/image/:image_id').delete((request, response) => {
  
    let recipe_id = request.params.recipe_id;
    let image_id = request.params.image_id;

    usrcommon.validateBasicAuth(request, response , (user_id) =>{

        recipeCommon.isUserAuthorized(recipe_id,user_id,request,response, (isAuth) => {
            
          if(isAuth == "Authorized"){
           
              db.getImageById(image_id, recipe_id, (data)=>{
                if(data && data.rowCount > 0){
                  let fileName = data.rows[0].file_name;
                  console.log(fileName);
                  s3Upload.deleteObject(request, response, fileName, (data)=>{
                    recipeCommon.deleteImageInDB(recipe_id, image_id, response);
                    
                  });
                }
                else{ 
                  response.status(400).send();
                }
              });
            
          }  
        });
      });

  });

