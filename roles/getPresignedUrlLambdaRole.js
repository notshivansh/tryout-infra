"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const {tryoutS3Bucket} = require("../s3Bucket");

const ceatePresignedUrlPolicyText = pulumi.all([tryoutS3Bucket.bucket]).apply(([bucket]) => `{
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
              "s3:PutObject",
              "s3:PutObjectAcl",
              "s3:PutLifecycleConfiguration"
          ],
          "Resource": [
              "arn:aws:s3:::${bucket}",
              "arn:aws:s3:::${bucket}/*"
          ]
      }
    ]
  }
  `);

const ceatePresignedUrlPolicy = new aws.iam.Policy("ceatePresignedUrlPolicy", {
    policy: ceatePresignedUrlPolicyText
})


const getPresignedUrlLambdaRole = new aws.iam.Role("getPresignedUrlLambdaRole", {
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

const rpa1 = new aws.iam.RolePolicyAttachment("rpa1", {
    policyArn: ceatePresignedUrlPolicy.arn,
    role: getPresignedUrlLambdaRole
})

module.exports = {getPresignedUrlLambdaRole};