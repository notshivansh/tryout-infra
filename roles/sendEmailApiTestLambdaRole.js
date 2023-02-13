"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const {tryoutS3Bucket} = require("../s3Bucket");
const {statusTable} = require("../statusTable")

const sendEmailPolicyText = pulumi.all([tryoutS3Bucket.bucket,statusTable.name]).apply(([bucket,table]) => `{
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
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:PutLifecycleConfiguration"
            ],
            "Resource": [
                "arn:aws:s3:::${bucket}",
                "arn:aws:s3:::${bucket}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendTemplatedEmail",
                "ses:SendCustomVerificationEmail",
                "ses:SendRawEmail"
            ],
            "Resource": [
                "arn:aws:ses:*:*:configuration-set/*",
                "arn:aws:ses:*:*:identity/*",
                "arn:aws:ses:*:*:template/*"
            ]
        }
    ]
}
`);

const sendEmailApiTestLambdaRole = new aws.iam.Role("sendEmailApiTestLambdaRole", {assumeRolePolicy: `{
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

const sendEmailPolicy = new aws.iam.Policy("sendEmailPolicy", {
    policy: sendEmailPolicyText
})

const rpa2 = new aws.iam.RolePolicyAttachment("rpa2", {
    policyArn: sendEmailPolicy.arn,
    role: sendEmailApiTestLambdaRole
})

module.exports = {sendEmailApiTestLambdaRole};