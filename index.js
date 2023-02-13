"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");
const apigateway = require("@pulumi/aws-apigateway")
const {sendEmailApiTestLambdaRole} = require("./roles/sendEmailApiTestLambdaRole");
const {getPresignedUrlLambdaRole} = require("./roles/getPresignedUrlLambdaRole");
const {getTestStatusLambdaRole} = require("./roles/getTestStatusLambdaRole");
const {runApiTestLambdaRole} = require("./roles/runApiTestLambdaRole")
const {clusterTaskRole} = require("./roles/clusterTaskRole");
const {tryoutS3Bucket} = require("./s3Bucket");
const {awsNodeSDKLayer,uuidNodeSDKLayer} = require("./lambdaLayers");
const {statusTable} = require("./statusTable")

const awsConfig = new pulumi.Config("aws");
const awsRegion = awsConfig.get("region");

const subnets = new aws.ec2.getSubnets({
    filters : [
        {
            "name" : "vpc-id",
            "values" : ["vpc-04c8b59874a772a05"]
        }
    ]
})

const subnetList = subnets.then((data)=>{
    return data.ids.toString();
})

const getPresignedUrlLambda = new aws.lambda.Function("getPresignedUrl", {
    code: new pulumi.asset.FileArchive("./archives/getPresignedUrl.zip"),
    role: getPresignedUrlLambdaRole.arn,
    handler: "getPresignedUrl.handler",
    environment: {
        variables: {
            UploadBucket: tryoutS3Bucket.bucket
        }
    },
    runtime: "nodejs18.x",
    layers: [awsNodeSDKLayer.arn, uuidNodeSDKLayer.arn]
});

const repository = new awsx.ecr.Repository("tryout-repository", {});
const image = new awsx.ecr.Image("tryout-image",{
    repositoryUrl : repository.url,
    path : "./javaCode/community-edition/apps/tryout"
});

const containerDefinitions = pulumi.all([image.imageUri]).apply(([uri])=>`
[
    {
        "name": "tryout",
        "image": "${uri}",
        "cpu": 0,
        "portMappings": [
            {
                "name": "tryout-80-tcp",
                "containerPort": 80,
                "hostPort": 80,
                "protocol": "tcp",
                "appProtocol": "http"
            }
        ],
        "essential": true,
        "environment": [],
        "environmentFiles": [],
        "mountPoints": [],
        "volumesFrom": [],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-create-group": "true",
                "awslogs-group": "/ecs/tryout-task",
                "awslogs-region": "ap-southeast-1",
                "awslogs-stream-prefix": "ecs"
            }
        }
    } ]`);

const tryoutTask = new aws.ecs.TaskDefinition("tryout-task",{
    family : "tryout-task",
    containerDefinitions : containerDefinitions,
    requiresCompatibilities : ["FARGATE"],
    cpu : "1024",
    memory : "3072",
    executionRoleArn : clusterTaskRole.arn,
    taskRoleArn : clusterTaskRole.arn,
    networkMode : "awsvpc",
    runtimePlatform : {
        // use X86_64 if built docker image on x86
        cpuArchitecture : "ARM64",
        operatingSystemFamily : "LINUX"
    }
})

const cluster = new aws.ecs.Cluster("tryout-cluster");

const fargateCluster = new aws.ecs.ClusterCapacityProviders("clusterprovider",{
    clusterName : cluster.name,
    capacityProviders : ["FARGATE","FARGATE_SPOT"],
});

const runApiTestLambda = new aws.lambda.Function("runApiTest", {
    code: new pulumi.asset.FileArchive("./archives/runApiTest.zip"),
    role: runApiTestLambdaRole.arn,
    handler: "runApiTest.handler",
    environment: {
        variables: {
            taskDefinition: tryoutTask.id,
            cluster : cluster.name,
            tableName : statusTable.name,
            subnets : subnetList
        }
    },
    runtime: "nodejs18.x",
    layers: [awsNodeSDKLayer.arn]
});

tryoutS3Bucket.onObjectCreated("runTest",runApiTestLambda,{
    filterPrefix : "input/"
})

const sendEmailApiTestLambda = new aws.lambda.Function("sendEmailApiTest", {
    code: new pulumi.asset.FileArchive("./archives/sendEmailApiTest.zip"),
    role: sendEmailApiTestLambdaRole.arn,
    handler: "sendEmailApiTest.handler",
    environment: {
        variables: {
            UploadBucket: tryoutS3Bucket.bucket,
            tableName : statusTable.name
        }
    },
    runtime: "nodejs18.x",
    layers: [awsNodeSDKLayer.arn]
})

tryoutS3Bucket.onObjectCreated("sendEmail",sendEmailApiTestLambda,{
    filterPrefix : "output/"
})

const getTestStatusLambda = new aws.lambda.Function("getTestStatus", {
    code: new pulumi.asset.FileArchive("./archives/getTestStatus.zip"),
    role: getTestStatusLambdaRole.arn,
    handler: "getTestStatus.handler",
    environment: {
        variables: {
            tableName : statusTable.name,
            sendEmailLambda : sendEmailApiTestLambda.name
        }
    },
    runtime: "nodejs18.x",
    layers: [awsNodeSDKLayer.arn]
});

const api = new apigateway.RestAPI("api", {
    routes: [
        {
            path: "/getPresignedUrl",
            method: "GET",
            eventHandler: getPresignedUrlLambda
        },
        {
            path: "/getTestStatus",
            method: "GET",
            eventHandler: getTestStatusLambda
        },
    ],
});

exports.getPresignedUrl = api.url
exports.bucketName = tryoutS3Bucket.bucket;
exports.tableName = statusTable.name;