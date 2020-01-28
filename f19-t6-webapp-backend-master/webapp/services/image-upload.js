const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const bucketNAME = process.env.BUCKET_NAME;

AWS.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    acl: 'public-read',
    s3: s3,
    bucket: bucketNAME,
    metadata: function (request, file, cb) {
      cb(null, {fieldName: 'TESTING_METADATA'});
    },
    key: function (request, file,  cb) {
      console.log("KEY REQUEST: " +file.originalname);
      cb(null, Date.now()+"-"+file.originalname);
    }
  })
});

const deleteObject = (request, response,fileName, callback)=>{
  console.log("s3 filename" + fileName);
  var params = {
    Bucket: bucketNAME,
    Key: fileName
  }
  s3.deleteObject(params, (err, data)=>{
    if(err){
      throw err;
      // response.send({"error": err});
    }
    else
    callback(data);
  });
}

module.exports = {
  upload,
  deleteObject
}
