import AWS from 'aws-sdk';
const lambda = new AWS.Lambda();

const sendEmail = async (sendEmailLambda,key) =>{
  const params = {
    FunctionName: sendEmailLambda,
    InvocationType: 'RequestResponse',
    LogType: 'None',
    Payload: ` { "Records":[ { "s3":{ "object":{ "key":"${key}" } } } ] }`,
  };
  console.log(params);
  const response = await lambda.invoke(params).promise();
  console.log(response);
}

const updateEmail = async (tableName, email, id) => {
  const docClient = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: tableName,
    Key : { 
      "id" : id
    },
    UpdateExpression: 'set email = :r',
    ConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ':r': email,
      ':id': id
    },
  };

  await docClient.update(params).promise();
}

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


export const handler = async(event) => {
    console.log(JSON.stringify(event));
    
    let id = event.queryStringParameters.id
    let tableName = process.env.tableName;
    let sendEmailLambda = process.env.sendEmailLambda;

    var params = {
        AttributesToGet: [
          "status",
          "email"
        ],
        TableName : tableName,
        Key : { 
          "id" : {
            "S" : id
          }
        }
      }
    
    let itemDetails = await new AWS.DynamoDB().getItem(params).promise();
    
    // if status is "", STARTED, TEST_COMPLETED then allow both - update or send email
    // if status is EMAIL_SENT, then don't allow any of update or send email

    if(itemDetails.Item.status['S']=="EMAIL_SENT"){
      const response = {
        statusCode: 200,
        body: JSON.stringify("Test results have already been sent.")
    };
    return response;
    }
    
    if (event.queryStringParameters.email && validateEmail(event.queryStringParameters.email)) {
      await updateEmail(tableName, event.queryStringParameters.email, id);
    }
    
    itemDetails = await new AWS.DynamoDB().getItem(params).promise();
    if(itemDetails.Item.status['S']=="TEST_COMPLETED"){
      console.log(id);
      console.log("sending");
      await sendEmail(sendEmailLambda,id);
    }
    
    console.log(itemDetails)

    const response = {
        statusCode: 200,
        body: JSON.stringify(itemDetails),
    };
    return response;
};
