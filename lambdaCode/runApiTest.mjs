import AWS from 'aws-sdk'
let ecs = new AWS.ECS()

export const handler = async(event) => {
    let record = event.Records[0];
        let objDetails = { Bucket: record.s3.bucket.name, Key: record.s3.object.key}
        let taskDefinition = process.env.taskDefinition;
        let cluster = process.env.cluster;
        let tableName = process.env.tableName;
        let subnets = process.env.subnets;
        subnets = subnets.split(",");
        console.log(objDetails);
    var params = {
      cluster: cluster,
      enableECSManagedTags: true,
      launchType: "FARGATE",
      count: 1,
      platformVersion: 'LATEST',
      networkConfiguration: { 
        awsvpcConfiguration: { 
            assignPublicIp: "ENABLED",
            // securityGroups: ["sg-05a569ca0b986a08e"],
            subnets: subnets
        }
      },
      startedBy: "runApiTest",
      taskDefinition: taskDefinition,
      overrides:{
          containerOverrides:[{
              name:"tryout",
              environment:[
                  {
                      "name":"SRCBUCKET",
                      "value":objDetails.Bucket
                  },
                  {
                      "name":"SRCKEY",
                      "value":objDetails.Key
                  },
                  {
                      "name":"TABLENAME",
                      "value": tableName
                  }
                  ]
          }]
      }
    }

    await ecs.runTask(params).promise();
    console.log("ecs invoked");
    
    
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };

    return response;
};
