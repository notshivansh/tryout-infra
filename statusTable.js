"use strict";
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");

const statusTable = new aws.dynamodb.Table("runTestID", {
    attributes: [{
        name: "id",
        type: "S"
    }],
    hashKey: "id",
    writeCapacity: 1,
    readCapacity: 1
});
const dynamodbTableReadTarget = new aws.appautoscaling.Target("dynamodbTableReadTarget", {
    maxCapacity: 10,
    minCapacity: 1,
    resourceId: pulumi.all([statusTable.name]).apply(([table]) =>`table/${table}`),
    scalableDimension: "dynamodb:table:ReadCapacityUnits",
    serviceNamespace: "dynamodb",
});
const dynamodbTableReadPolicy = new aws.appautoscaling.Policy("dynamodbTableReadPolicy", {
    policyType: "TargetTrackingScaling",
    resourceId: dynamodbTableReadTarget.resourceId,
    scalableDimension: dynamodbTableReadTarget.scalableDimension,
    serviceNamespace: dynamodbTableReadTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBReadCapacityUtilization",
        },
        targetValue: 70,
    },
});
const dynamodbTableWriteTarget = new aws.appautoscaling.Target("dynamodbTableWriteTarget", {
    maxCapacity: 10,
    minCapacity: 1,
    resourceId: pulumi.all([statusTable.name]).apply(([table]) =>`table/${table}`),
    scalableDimension: "dynamodb:table:WriteCapacityUnits",
    serviceNamespace: "dynamodb",
});
const dynamodbTableWritePolicy = new aws.appautoscaling.Policy("dynamodbTableWritePolicy", {
    policyType: "TargetTrackingScaling",
    resourceId: dynamodbTableWriteTarget.resourceId,
    scalableDimension: dynamodbTableWriteTarget.scalableDimension,
    serviceNamespace: dynamodbTableWriteTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBWriteCapacityUtilization",
        },
        targetValue: 70,
    },
});

module.exports = {statusTable}