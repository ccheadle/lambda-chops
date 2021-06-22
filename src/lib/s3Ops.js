// Import Amazon SDKs
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Upload S3 bucket object
const uploadFile = (params) => {
  return new Promise((resolve, reject) => {
    // Upload file
    s3.putObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Get S3 bucket object
const getFile = (params) => {
  return new Promise((resolve, reject) => {
    // Retrieve file
    s3.getObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports = {
  uploadFile,
  getFile,
};
