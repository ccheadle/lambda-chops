// Import Winston logger wrapper
const { errorStackFormat, logger } = require('./lib/logger');

// Import S3 handler functions
const { getFile, uploadFile } = require('./lib/s3Ops');

// For logging and status
const { version } = require('../package.json');

// Serverless entry point.
module.exports.handler = async (event, context, callback) => {
  const date = new Date();
  const timestamp = date.toISOString();
  const fileName = 'hello-world.txt';

  const s3_bucket_name = process.env.S3_BUCKET_NAME;
  let response = {};

  // Set logging metadata
  logger.defaultMeta = {
    appName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    appVersion: version,
    requestId: context.awsRequestId,
    ts: date,
  };

  if (event.httpMethod == 'POST') {
    // Parse request body
    const requestBody = JSON.parse(event.body);

    // Variable to write to S3 file
    const {
      envar, //
    } = requestBody;

    // Build payload
    let content = JSON.stringify({
      timestamp,
      envar,
    });

    // Set S3 bucket paramters
    const params = {
      Bucket: s3_bucket_name,
      Key: fileName,
      Body: content,
      ContentType: 'application/text',
    };

    // Upload file to S3
    try {
      const data = await uploadFile(params);
      logger.defaultMeta.statusCode = 200;
      logger.info(
        `Successfully uploaded file '${fileName}' to S3 bucket '${s3_bucket_name}'`,
        {
          event: {
            bucketResponse: data,
          },
        },
      );

      // Return S3 object result data
      response = {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully uploaded file '${fileName}' to S3 bucket '${s3_bucket_name}'`,
          bucketResponse: data,
        }),
      };
    } catch (error) {
      logger.defaultMeta.statusCode = 404;
      logger.error(
        `Error uploading file '${fileName}' to S3 bucket '${s3_bucket_name}'`,
        {
          event: {
            error,
            errorCode: error.code,
            errorMessage: error.message,
          },
        },
      );

      // Return error message if upload fails
      response = {
        statusCode: 404,
        body: JSON.stringify({
          message: `Error uploading file '${fileName}' to S3 bucket '${s3_bucket_name}'`,
          error: errorStackFormat(error),
        }),
      };
    }
  } else if (event.httpMethod == 'GET' && event.path == '/retrieve') {
    // Set S3 bucket paramters
    const params = {
      Bucket: s3_bucket_name,
      Key: fileName,
    };

    try {
      const data = await getFile(params);

      logger.defaultMeta.statusCode = 200;
      logger.info(
        `Successfully retrieved data from S3 bucket '${s3_bucket_name}'`,
      );

      // Return S3 object contents
      response = {
        statusCode: 200,
        body: JSON.stringify(data.Body.toString('utf-8')),
      };
    } catch (error) {
      logger.defaultMeta.statusCode = 404;
      logger.error(
        `Error retrieving file '${fileName}' from S3 bucket '${s3_bucket_name}'`,
        {
          event: {
            error,
            errorCode: error.code,
            errorMessage: error.message,
          },
        },
      );

      // Return error message if retrieval fails
      response = {
        statusCode: 404,
        body: JSON.stringify({
          message: `Error retrieving file '${fileName}' from S3 bucket '${s3_bucket_name}'`,
          error: errorStackFormat(error),
        }),
      };
    }
  } else if (event.httpMethod == 'GET' && event.path == '/status') {
    // Return application status message
    response = {
      statusCode: 200,
      body: JSON.stringify({
        appName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        appVersion: version,
        lambdaFunctionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        awsRegion: process.env.AWS_REGION,
        logLevel: process.env.LOG_LEVEL,
      }),
    };
  } else {
    // Catch unknown GET requests.
    logger.defaultMeta.statusCode = 404;
    logger.warn(`Invalid resource requested`, {
      event: {
        path: event.path,
        method: event.httpMethod,
      },
    });

    response = {
      statusCode: 404,
      body: JSON.stringify({
        message: `Invalid resource requested. Please review README.md for usage.`,
      }),
    };
  }

  // Return response to client
  return response;
};
