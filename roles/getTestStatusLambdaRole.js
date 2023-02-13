"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const {statusTable} = require("../statusTable")

const getTestStatusPolicyText = pulumi.all([statusTable.name]).apply(([table]) =>`{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
          },
          {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunctionUrl",
                "lambda:InvokeFunction"
            ],
            "Resource": "arn:aws:lambda:*:*:function:*"
        },
        {
            "Effect": "Allow",
            "Action": "lambda:ListFunctions",
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:DescribeTable",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/${table}"
        },
        {
            "Effect": "Allow",
            "Action": "dynamodb:ListTables",
            "Resource": "*"
        }
    ]
  }
  `);

const getTestStatusPolicy = new aws.iam.Policy("getTestStatusPolicy", {
    policy: getTestStatusPolicyText
})


const getTestStatusLambdaRole = new aws.iam.Role("getTestStatusLambdaRole", {
    assumeRolePolicy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Effect": "Allow",
        "Sid": ""
      }
    ]
  }
  `});

const rpa3 = new aws.iam.RolePolicyAttachment("rpa3", {
    policyArn: getTestStatusPolicy.arn,
    role: getTestStatusLambdaRole
})

module.exports = {getTestStatusLambdaRole};