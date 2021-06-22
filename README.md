# Lambda Chops

![logo](logo.jpg)

This is an sample application to demonstrate various AWS Serverless, AWS S3, Cloudwatch, and Github possibilities.
The concept for this is a simple API to allow the update of a single variable that is stored in an S3 bucket that clients can retrieve.

# Application structure

The lamba has both a `dev` and a `prod` stage for deploying the lambda.
There is a role for invoking the lambda which is kept separate from the Github Action deployment user.
Secrets for the application are stored in AWS Secrets Manager, and the output is stored in encrypted S3 buckets for each stage.
API Gateway caching is enabled for GET requests with a TTL of 60 seconds.
Logging to Cloudwatch is enabled and an overview dashboard exists to easily find logging and stats.

## IAM structure

Users and groups have been created to grant the least access necessary to perform the given actions.

**Users/Groups**
- `lambda-chops-client-group` - Group
  - `lambda-chops` - R/W S3, Access Cloudwatch
  - `lambda-chops-client` - S3 Read (only to S3 content buckets)
  - `lambda-chops-deploy` - Deploy from GH Actions (only S3 R/W to deployment bucket)

**Roles**
- `lambda-chops-execute` - Invoke application

**Policies**
- Full S3 access: `FullAccessLambdaChopsBucket`
- List/Read S3: `LambdaChopsS3BucketReadOnly`

## S3 Usage

There is a `dev` and a `prod` bucket that each respective stage writes too.
A special user has been created that has read-only access to this bucket to simulate what an end user or client application may use to access the data.

# Usage

HTTP requests to the associated API gateway trigger the lambda to execute.
This application will accept a POST request with a key/value pair and will write the value and timestamp to an S3 bucket in a file named `hello-world.txt`
The application can also retrieve the contents of the `hello-world.txt` and return the output to the user.

## Write new value (POST request)

You may post an `envar` value to the endpoint which will save the time stamp and value to the *'hello-world.txt'* file in the configured S3 bucket.

Stage:
- dev: https://u1e9ekwnh4.execute-api.us-east-1.amazonaws.com/dev/
- prod: https://y7it7ykb16.execute-api.us-east-1.amazonaws.com/prod/

Body:
```
{
  "envar": <ENVAR VALUE>
}
```

With curl:

ex: `curl -H "Content-Type: application/json" -X POST https://u1e9ekwnh4.execute-api.us-east-1.amazonaws.com/dev/ -d'{"envar":"MY_VALUE"}'`

## Retrieve value (GET request)

You can get the contents of the hello-world.txt file with a GET request:

Stage:
- dev: https://u1e9ekwnh4.execute-api.us-east-1.amazonaws.com/dev/retrieve
- prod: https://y7it7ykb16.execute-api.us-east-1.amazonaws.com/prod/retrieve

With curl:

ex: `curl https://u1e9ekwnh4.execute-api.us-east-1.amazonaws.com/dev/retrieve`

## Status endpoint

The status endpoint gives basic application information without compromising security best practices. AWS runtime environment variables as well as the application invocation environment variables are surfaced here.

- dev: https://u1e9ekwnh4.execute-api.us-east-1.amazonaws.com/dev/status
- prod: https://y7it7ykb16.execute-api.us-east-1.amazonaws.com/prod/status

# Development

This application is build with NodeJS, and Serverless.
Note: AWS Lambdas are currently limited to using node 12.x and will not deploy with a higher version.

Eslint and Prettier are installed run as pre-commit hooks via Husky.
# Testing

To run the lambda as a local endpoint:
```
npx sls offline start --stage <stage>
```
or to run a single test event
```
npm run test:sls
```

## Test with Insomnia:

You can import the included `Insomnia_config` to test the local and cloud instances.

# Deploy

You can deploy this application with serverless at the command line with `npx sls`, or by pushing commits to the `main` or `development` branches on Github.
```
npx serverless deploy --stage <stage>
```

A Github action is configured to build and deploy the application to AWS. The AWS credentials for deploy are stored in as Github secrets and are the are the same as the IAM role that invokes the lambda.

# Logging

Logs are sent to Cloudwatch
Dashboard/Overview: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Lambda-Chops

Logs are created with Winston.

Sample log messages:

```
{
   "appName":"lambda-chops-dev-lambda-chops",
   "appVersion":"0.1.0",
   "requestId":"ckq4vpsui0008xzoueynzh0md",
   "ts":"2021-06-20T00:00:00.000Z",
   "statusCode":404,
   "event":{
      "error":{
         "message":"The specified key does not exist.",
         "code":"NoSuchKey",
         "region":null,
         "time":"2021-06-20T00:00:00.000Z",
         "requestId":"P343JM5GBQSWFE3H",
         "extendedRequestId":"YWm6Xm1uccxHV0h/+KAhRK49aJw4NuheKGiqYJ+3cEfpWPF4cvJ0SmntQiCViRuKARu9X4IYNis=",
         "statusCode":404,
         "retryable":false,
         "retryDelay":15.777252421283183
      },
      "errorCode":"NoSuchKey",
      "errorMessage":"The specified key does not exist."
   },
   "level":"error",
   "message":"Error retrieving file 'hello-world.txt' from S3 bucket 'lambda-chops-s3-dev'"
}
```

```
{
   "appName":"lambda-chops-dev-lambda-chops",
   "appVersion":"0.1.0",
   "requestId":"ckq4vt1ct000bxzoue06k1mqe",
   "ts":"2021-06-20T00:00:00.000Z",
   "statusCode":404,
   "event":{
      "path":"/badurl",
      "method":"GET"
   },
   "level":"warn",
   "message":"Invalid resource requested"
}
```

```
{
   "appName":"lambda-chops-dev-lambda-chops",
   "appVersion":"0.1.0",
   "requestId":"ckq4w1ehz0008wmou7wd5gz65",
   "ts":"2021-06-20T00:00:00.000Z",
   "statusCode":200,
   "event":{
      "bucketResponse":{
         "ETag":"\"fa4d5b5c8182d06fec9bd0769bc553d0\"",
         "ServerSideEncryption":"AES256"
      }
   },
   "level":"info",
   "message":"Successfully uploaded file 'hello-world.txt' to S3 bucket 'lambda-chops-s3-dev'"
}
```

# AWS CLI operations

## Bucket operations (AWS CLI)

List bucket contents:
```
aws s3 ls s3://lambda-chops-s3-dev
```

Download file:
```
aws s3 cp s3://lambda-chops-s3-dev/hello-world.txt .
```

## Lambda interactions

You can change the log level of the running application:
```
aws lambda update-function-configuration --function-name lambda-chops-dev-lambda-chops \
    --environment "Variables={S3_BUCKET_NAME=lambda-chops-s3-prod,LOG_LEVEL=debug}"
```

You can check the current log level of the running application:
```
aws lambda get-function-configuration --function-name lambda-chops-dev-lambda-chops
```

NB. Updating environment variables this way is *en bloc*, requiring that all variable values to be set in the operation.
NB2. Changes made with this method will override the serverless.yml configuration and persist between redeployments.

# Extension

Possible enhancements for this project:
- UI to view and manage multiple env vars
- Add api key requirement for tracking and auth
- Cache invalidation on update
- Encrypt cached traffic
- Convert Github Actions to a Jenkins job to separate code processing from Ops concerns
- Enable S3 bucket versioning as a way to view history or roll back changes (assuming a DB-backed solution isn't desirable)