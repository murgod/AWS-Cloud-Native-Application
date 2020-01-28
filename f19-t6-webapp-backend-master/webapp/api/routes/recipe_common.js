const db = require("../../queries.js");
const usrcommon = require("./user_common");
const uuidv4 = require('uuid/v4');

//function to check authorization
var isUserAuthorized = (recipe_id,user_id,req,res, callback) => {
    db.getRecipiesById(recipe_id, function(data){
        console.log("user_id: "  + user_id)

        if(data.rowCount <= 0){
            res.status(204).send();
        }
        else if(data[0].author_id == user_id ){
            callback("Authorized");
        }
        else{
            res.status(403).json({response:{
                message: "Forbidden!!"
                }
            }).send();
        }

    });
}


// function for insert image data to db
var addImageDataToDB = (recipe_id, request, response, imageUrl, fileName)=>{

    let image_id = uuidv4();
    console.log("Image name filename " + fileName);

    db.addImage(recipe_id,image_id,imageUrl, fileName, (result)=>{
  
        db.getImageById(image_id,recipe_id, function(data){
            if(data.rowCount <= 0){
                response.status(204).send();
            }
            else{
                response.status(201).json(data.rows).send();
            }
        });
    });
  }

  // Image by Id
  var getImageByID = (recipe_id, image_id, response) => {
    db.getImageById(image_id,recipe_id, function(data){
      if(data.rowCount <= 0){
          response.status(404).send();
      }
      else{
          response.status(200).json(data.rows).send();  
      }
    });
  }

  // Delete image details in DB
  var deleteImageInDB = (recipe_id, image_id, response)=>{
    db.deleteImage(recipe_id,image_id,(result)=>{
      if(result.rowCount <= 0){
          response.status(400).send();
      }
      else{
          response.status(204).send();
      }
  });
  }

  // get Images by recipe_id
  var getImagesByRecipeId= (recipe_id, callback) => {
    db.getImagesByRecipeId(recipe_id, function(data){

        callback(data.rows);
    });
  }

module.exports = {
    isUserAuthorized,
    addImageDataToDB,
    getImageByID,
    deleteImageInDB,
    getImagesByRecipeId
}