import AWS from 'aws-sdk'
const s3 = new AWS.S3()
import {v4 as uuid } from "uuid";

const URL_EXPIRATION_SECONDS = 300

export const handler = async (event) => {
  return await getUploadURL(event)
}

const getUploadURL = async function(event) {
  console.log(event);
  let type = event.queryStringParameters.type;
  const randomID = uuid()
  const Key = `input/${randomID}.` + type;

  const s3Params = {
    Bucket: process.env.UploadBucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: type== 'json'? 'application/json' : 'application/octet-stream'
  }

  console.log('Params: ', s3Params)
  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params)
  return {
    isBase64Encoded: false,
    statusCode: 200,
    body: JSON.stringify({
      uploadURL:uploadURL,
      Key
    })
  }
}