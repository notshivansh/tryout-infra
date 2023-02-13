const aws = require("@pulumi/aws");

const tryoutS3Bucket = new aws.s3.Bucket("tryouts3bucket", {
    acl: "public-read",
    versioning: {
        enabled: true
    }
})

module.exports = {tryoutS3Bucket}