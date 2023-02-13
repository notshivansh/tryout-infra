"use strict";
const aws = require("@pulumi/aws");

const runApiTestPolicyText = `{
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
                "ecs:RunTask",
                "ecs:StartTask"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::*:role/*"
        }
    ]
  }
  `;

const runApiTestPolicy = new aws.iam.Policy("runApiTestPolicy", {
    policy: runApiTestPolicyText
})

const runApiTestLambdaRole = new aws.iam.Role("runApiTestLambdaRole", {
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

const rpa4 = new aws.iam.RolePolicyAttachment("rpa4", {
    policyArn: runApiTestPolicy.arn,
    role: runApiTestLambdaRole
})

module.exports = {runApiTestLambdaRole};