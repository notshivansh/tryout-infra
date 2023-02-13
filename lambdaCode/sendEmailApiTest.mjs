import AWS from 'aws-sdk'
const s3 = new AWS.S3()
const URL_EXPIRATION_SECONDS = 21600

const getDownloadURL = async function (Bucket, Key) {
    const s3Params = {
        Bucket,
        Key,
        Expires: URL_EXPIRATION_SECONDS
    };
    const downloadURL = await s3.getSignedUrlPromise('getObject', s3Params);
    return JSON.stringify(downloadURL)
}

const getStaticDownloadUrl = function (Bucket,Key) {
    if(!Key.startsWith("output")){
        Key = "output/" + Key + ".csv";
    }
    return `<a href="http://${Bucket}.s3.amazonaws.com/${Key}" download>download link</a>`
}

const updateStatus = async (id,tableName) => {
    const docClient = new AWS.DynamoDB.DocumentClient();
    const emailSent = "EMAIL_SENT";

    if(id.startsWith("output")){
        id = id.split("/");
        id = id[1].split(".")
        id = id[0];
    }
    console.log(id)

    const params = {
        TableName: tableName,
        Key: {
            "id": id
        },
        UpdateExpression: 'set #st = :r',
        ConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ':r': emailSent,
            ':id': id
        },
        ExpressionAttributeNames: {
            "#st": "status"
        }
    };

    await docClient.update(params, function (err, data) {
        if (err) {
            console.log("error: " + JSON.stringify(err));
        } else {
            console.log("data: " + JSON.stringify(data));
        }
    }).promise();
}

let sendEmail = async (recipientEmail, downloadURL) => {
    let params = {
        Source: 'shivansh@akto.io',
        Destination: {
            ToAddresses: [
                recipientEmail
            ],
        },
        ReplyToAddresses: [],
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: 'The test results from akto are here. Check them out: ' + downloadURL,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `Hello from Akto`,
            }
        },
    };
    await new AWS.SES().sendEmail(params).promise();
};

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    let record = event.Records[0];
    let objDetails = { Bucket: process.env.UploadBucket, Key: record.s3.object.key };
    let tableName = process.env.tableName;
    console.log(objDetails);

    // let downloadUrl = await getDownloadURL(objDetails.Bucket, objDetails.Key);
    await sendEmail("shivansh@akto.io", getStaticDownloadUrl(objDetails.Bucket, objDetails.Key));
    await updateStatus(objDetails.Key,tableName);

    const response = {
        statusCode: 200,
        body: JSON.stringify('Email sent'),
    };
    return response;
};
