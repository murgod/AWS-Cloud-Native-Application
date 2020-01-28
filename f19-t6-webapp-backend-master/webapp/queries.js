//configuration for postgres
const Pool = require('pg').Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

var getUser = (email_address, callback) => {
    createTables((error, result)=>{
    if(error){
    console.log(error);
    throw error;
    }
    else{
      pool.query("SELECT * FROM users where email_address= '"+email_address+"' ORDER BY id ASC", (error, results) => {
        if (error) {
            console.log(error);
            throw error
        }
        else{
            console.log("In queries");
            callback(results.rows);
        }  
      })
    }
  });
  }

  // Create new user
  var createUser = (uuid,email_address, passwordHash,first_name, last_name, callback) => {

    createTables((error, result)=>{
      if(error){
        console.log(error);
        throw error;
  
      }
      else{
        pool.query('INSERT INTO users (id, email_address, password, first_name,last_name, account_created,account_updated) VALUES ($1, $2, $3, $4, $5, NOW(),NOW())', [uuid,email_address, passwordHash, first_name, last_name], (error, result) => {
          if (error) {
            console.log(error);
            callback(false);
          }
          else{
            callback(true);
          }
        });
      }
    });  
  }

  // Check if table exist or not
  var createTables = (callback)=>{

    pool.query((`CREATE TABLE IF NOT EXISTS users (id VARCHAR(200), first_name VARCHAR(200),last_name  VARCHAR(200),password VARCHAR(200), email_address VARCHAR(30) NOT NULL, account_created VARCHAR(200) NOT NULL, account_updated VARCHAR(200));`),() => {
      
      pool.query((`CREATE TABLE IF NOT EXISTS recipe (
	                  id VARCHAR(200), 
	                  created_ts VARCHAR(200) NOT NULL,
	                  updated_ts VARCHAR(200),
	                  author_id VARCHAR(200) NOT NULL,
	                  cook_time_in_min INTEGER,
	                  prep_time_in_min INTEGER,
	                  total_time_in_min INTEGER,
	                  title VARCHAR(200),
	                  cuisine VARCHAR(200),
	                  servings INTEGER
                    );`),() => {

                      pool.query((`CREATE TABLE IF NOT EXISTS steps (
                                    recipe_id VARCHAR(200) NOT NULL,  
                                    position INTEGER,
                                    items VARCHAR(200)
                                    );`) , () =>{

                                      pool.query((`CREATE TABLE IF NOT EXISTS nutrition_information (
                                        recipe_id VARCHAR(200) NOT NULL, 
                                        calories INTEGER, 
                                        cholesterol_in_mg INTEGER,
                                        sodium_in_mg INTEGER,
                                        carbohydrates_in_grams decimal,
                                        protein_in_grams decimal
                                        );`) , () =>{
                                                    pool.query((`CREATE TABLE IF NOT EXISTS ingredients (
                                                      recipe_id VARCHAR(200) NOT NULL,  
                                                      items VARCHAR(200) NOT NULL
                                                    );`) , () =>{

                                                      pool.query(`CREATE TABLE IF NOT EXISTS images(id VARCHAR(200) NOT NULL,
                                                      url varchar(200),
                                                      recipe_id VARCHAR(200) NOT NULL,
                                                      file_name VARCHAR(200));`, (error, results)=>{
                                                                    callback();
                                                    });
                                                  });
                                      });
                      });
                        
        });
    });
  }

  // get user by Id
var getUserById = (userId,callback) => {

    createTables((error, result)=>{
        if(error){
        console.log(error);
        throw error;
        }
        else{
          pool.query("SELECT id, first_name,last_name, email_address, account_created,account_updated FROM users where id = '" + userId+ "';", (error, results) => {
            if (error) {
                console.log(error);
                throw error
            }
            else{
                console.log("In getUserById queries");
                callback(results.rows);
            }  
          })
        }
      });
}

// update user
var updateUser = (first_name, last_name,passwordHash, userId, callback) =>{
    pool.query("UPDATE users SET first_name = $1, last_name = $2,  password = $3, account_updated = NOW() WHERE id = $4 ",[first_name,last_name,passwordHash, userId],
     (error, results) => {
         if(error)
         {
             throw error;
         }
         else{
            callback(results);
         }
      });
}

// Create recipe
var createRecipe = (recipe_id, userId, cook_time_in_min, prep_time_in_min,total_time_in_min, title, cuisine, servings, callback) =>{

  pool.query('INSERT INTO recipe (id, author_id, cook_time_in_min, prep_time_in_min,total_time_in_min, title,cuisine, servings, created_ts, updated_ts) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(),NOW())',
                                   [recipe_id,userId, cook_time_in_min, prep_time_in_min, total_time_in_min, title, cuisine, servings],
   (error, results) => {
       if(error)
       {
           throw error;
       }
       else{
          callback(results);
       }
    });
}

// update recipe
var updateRecipe = (recipe_id, userId, cook_time_in_min, prep_time_in_min,total_time_in_min, title, cuisine, servings, callback) =>{

  pool.query('UPDATE recipe SET cook_time_in_min = $1, prep_time_in_min = $2, total_time_in_min = $3, title = $4, cuisine= $5, servings = $6, updated_ts = NOW()',
              [cook_time_in_min, prep_time_in_min, total_time_in_min, title, cuisine, servings],
   (error, results) => {
       if(error)
       {
           throw error;
       }
       else{
          callback(results);
       }
    });
}

// Add steps to recioe
var addSteps = (recipe_id,position, items, callback) =>{
  pool.query('INSERT INTO steps (recipe_id,position, items) VALUES ($1, $2, $3)',
              [recipe_id,position,items],
        
              (error, results) => {
                if(error)
                {
                    throw error;
                }
                else{
                   callback(results);
                }
             }
   )
}

// Add ingredients to recipe
var addIngredients = (recipe_id, items, callback) =>{
  pool.query('INSERT INTO ingredients (recipe_id, items) VALUES ($1, $2)',
              [recipe_id, items],
        
              (error, results) => {
                if(error)
                {
                    throw error;
                }
                else{
                   callback(results);
                }
             }
   )
}

// Add nutrition values to recipe
var addNutrition = (recipe_id, calories, sodium_in_mg, carbohydrates_in_grams, cholesterol_in_mg, protein_in_grams , callback) =>{
  pool.query('INSERT INTO nutrition_information (recipe_id, calories,sodium_in_mg, carbohydrates_in_grams, cholesterol_in_mg, protein_in_grams) VALUES ($1, $2, $3, $4, $5 ,$6)',
              [recipe_id, calories, sodium_in_mg, carbohydrates_in_grams, cholesterol_in_mg, protein_in_grams ],
        
              (error, results) => {
                if(error)
                {
                    throw error;
                }
                else{
                   callback(results);
                }
             }
   )
}

// get all recipies
var getAllRecipies = (callback) => {
  createTables((error, result)=>{
  if(error){
  console.log(error);
  throw error;
  }
  else{
    pool.query("SELECT * FROM recipe ORDER BY created_ts DESC", (error, results) => {
      if (error) {
          console.log(error);
          throw error
      }
      else{
          console.log("In getAllRecipies queries");
          callback(results.rows);
      }  
    })
  }
});
}

// get all ingredients based on recipe_id
var fetchIngredients = (recipe_id,callback) => {
    pool.query("SELECT items FROM ingredients WHERE recipe_id = '" + recipe_id +"';", (error, results) => {
      if (error) {
          console.log(error);
          throw error
      }
      else{
          console.log("In fetchIngredients queries");
          callback(results.rows);
      }  
    });
}

// get all steps based on recipe_id
var fetchSteps = (recipe_id,callback) => {

    pool.query("SELECT position, items FROM steps WHERE recipe_id = '" + recipe_id +"';", (error, results) => {
      if (error) {
          console.log(error);
          throw error
      }
      else{
          console.log("In fetchSteps queries");
          callback(results.rows);
      }  
    })
  
};

// get all nutritionl information based on recipe_id
var fetchNutritionInformation = (recipe_id,callback) => {

  pool.query("SELECT calories, cholesterol_in_mg,sodium_in_mg,carbohydrates_in_grams,protein_in_grams FROM nutrition_information WHERE recipe_id = '" + recipe_id +"';", (error, results) => {
    if (error) {
        console.log(error);
        throw error
    }
    else{
        console.log("In fetchNutritionInformation queries");
        callback(results.rows);
    }  
  })

};

// get all recipe by ID
var getRecipiesById = (recipe_id,callback) => {

  pool.query("SELECT * FROM recipe WHERE id = '"+ recipe_id+ "' ORDER BY created_ts DESC limit 1;", (error, results) => {
    if (error) {
        console.log(error);
        throw error
    }
    else{
        console.log("In getRecipiesById queries");
        callback(results.rows);
    }  
  })

};


// get all nutritionl information based on recipe_id
var deleteRecipe = (recipe_id,callback) => {

  pool.query("DELETE FROM recipe WHERE id = '"+ recipe_id+ "' ;", (error, results) => {
    if (error) {
        console.log(error);
        throw error
    }
    else{
        console.log("In deleteRecipe queries");
        callback(results.rows);
    }  
  })

};

// delete steps based on recipe id
var deleteSteps = (recipe_id,callback) => {

  pool.query("DELETE FROM steps WHERE recipe_id = '"+ recipe_id+ "' ;", (error, results) => {
    if (error) {
        console.log(error);
        throw error
    }
    else{
        console.log("In deleteSteps query");
        callback(results.rows);
    }  
  })

};


// delete steps based on recipe id
var deleteNutritionInformation = (recipe_id,callback) => {

  pool.query("DELETE FROM nutrition_information WHERE recipe_id = '"+ recipe_id+ "' ;", (error, results) => {
    if (error) {
        console.log(error);
        throw error
    }
    else{
        console.log("In deleteNutritionInformation query");
        callback(results.rows);
    }  
  })

};

// delete Ingredients based on recipe id
var deleteIngredients = (recipe_id,callback) => {

  pool.query("DELETE FROM ingredients WHERE recipe_id = '"+ recipe_id+ "' ;", (error, results) => {
    if (error) {
        console.log(error);
        throw error
    }
    else{
        console.log("In deleteIngredients query");
        callback(results.rows);
    }  
  })

};


// funtion to store image information
var addImage = (recipe_id, image_id, image_url, file_name, callback) => {

    pool.query('INSERT INTO images (id, url, recipe_id, file_name) VALUES($1, $2, $3, $4)' , [image_id,image_url, recipe_id, file_name], (error,result) => {
      if(error){
        console.log(error);
        throw error
        
      }
      else{
        callback(result);
      }
    });

}

// get image by image id
var getImageById = (images_id,recipe_id,callback) => {
  pool.query("SELECT * from images where  id='"+ images_id +"' AND recipe_id ='" + recipe_id +"'", (error, result) => {
      if(error){
          throw error
      }
      else{
          callback(result);
      }
  });
}

// Delete Image by Id
var deleteImage = (recipe_Id, image_id, callback) =>{
  pool.query("DELETE FROM images WHERE id = $1 AND recipe_id = $2",[image_id,recipe_Id],
   (error, results) => {
       if(error)
       {
           throw error;
       }
       else{
          callback(results);
       }
      
    });
}

// get image by image id
var getImagesByRecipeId = (recipe_id,callback) => {
  pool.query("SELECT * from images where recipe_id ='" + recipe_id +"'", (error, result) => {
      if(error){
          throw error
      }
      else{
          callback(result);
      }
  });
}

  module.exports = {
    getUser,
    createUser,
    getUserById,
    updateUser,

    // Recipe

    createRecipe,
    addSteps,
    addIngredients,
    addNutrition,

    // get 
    getAllRecipies,
    fetchIngredients,
    fetchSteps,
    fetchNutritionInformation,
    getRecipiesById,

    // delete
    deleteRecipe,
    deleteSteps,
    deleteNutritionInformation,
    deleteIngredients,
    updateRecipe,

    // Image
    addImage,
    getImageById,
    deleteImage,
    createTables,
    getImagesByRecipeId
}