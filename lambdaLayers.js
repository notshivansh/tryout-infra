const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

const awsNodeSDKLayer = new aws.lambda.LayerVersion("awsNodeSDKLayer", {
    compatibleRuntimes: ["nodejs18.x"],
    code: new pulumi.asset.FileArchive("./archives/LambdaAWS_SDK.zip"),
    layerName: "lambdaAWS_SDK",
    compatibleArchitectures: ["x86_64"]
})

const uuidNodeSDKLayer = new aws.lambda.LayerVersion("uuidNodeSDKLayer", {
    compatibleRuntimes: ["nodejs18.x"],
    code: new pulumi.asset.FileArchive("./archives/Lambda_UUID.zip"),
    layerName: "lambda_UUID",
    compatibleArchitectures: ["x86_64"]
})

module.exports = {awsNodeSDKLayer,uuidNodeSDKLayer}