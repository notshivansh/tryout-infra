"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const {tryoutS3Bucket} = require("../s3Bucket");
const {statusTable} = require("../statusTable")

const clusterTaskRolePolicyText = pulumi.all([tryoutS3Bucket.bucket,statusTable.name]).apply(([bucket,table]) =>  `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:DescribeTable",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/${table}"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
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

const clusterTaskRolePolicy = new aws.iam.Policy("clusterTaskRolePolicy", {
    policy: clusterTaskRolePolicyText
})

const clusterTaskRole = new aws.iam.Role("clusterTaskRole", {assumeRolePolicy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Effect": "Allow",
        "Sid": ""
      }
    ]
  }
  `});

const rpa5 = new aws.iam.RolePolicyAttachment("rpa5", {
    policyArn: clusterTaskRolePolicy.arn,
    role: clusterTaskRole
})

module.exports = {clusterTaskRole};