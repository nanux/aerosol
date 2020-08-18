const jiraAsiParams = `[
    {
        "ParameterKey": "AvailabilityZones",
        "ParameterValue": "{{availabilityZones}}"
    },
    {
        "ParameterKey": "DBMasterUserPassword",
        "ParameterValue": "{{dbPassword}}"
    },
    {   
        "ParameterKey": "DBMultiAZ",
        "ParameterValue": "{{multiAzDB}}"
    },
    {
        "ParameterKey": "DBPassword",
        "ParameterValue": "{{dbPassword}}"
    },
    {
        "ParameterKey": "DBStorage",
        "ParameterValue": "100"
    },
    {
        "ParameterKey": "DBStorageType",
        "ParameterValue": "Provisioned IOPS"
    },
    {
        "ParameterKey": "QSS3BucketName",
        "ParameterValue": "aws-quickstart"
    },
    {
        "ParameterKey": "QSS3KeyPrefix",
        "ParameterValue": "{{&productPrefix}}"
    },
    {
        "ParameterKey": "AccessCIDR",
        "ParameterValue": "0.0.0.0/0"
    }
]`

const confluenceAsiParams = `[
  {
    "ParameterKey": "AvailabilityZones",
    "ParameterValue": "{{availabilityZones}}"
  },
  {
    "ParameterKey": "DBMasterUserPassword",
    "ParameterValue": "{{dbPassword}}"
  },
  {
    "ParameterKey": "DBMultiAZ",
    "ParameterValue": "{{multiAzDB}}"
  },
  {
    "ParameterKey": "DBPassword",
    "ParameterValue": "{{dbPassword}}"
  },
  {
    "ParameterKey": "DBStorage",
    "ParameterValue": "100"
  },
  {
    "ParameterKey": "DBStorageType",
    "ParameterValue": "Provisioned IOPS"
  },
  {
    "ParameterKey": "CidrBlock",
    "ParameterValue": "10.0.0.0/16"
  },
  {
    "ParameterKey": "QSS3BucketName",
    "ParameterValue": "aws-quickstart"
  },
  {
    "ParameterKey": "QSS3KeyPrefix",
    "ParameterValue": "{{&productPrefix}}"
  }
]`

const bitbucketAsiParams = `[
    {
        "ParameterKey": "AvailabilityZones",
        "ParameterValue": "{{availabilityZones}}"
    },
    {
        "ParameterKey": "DBMasterUserPassword",
        "ParameterValue": "{{dbPassword}}"
    },
    {
        "ParameterKey": "BitbucketAdminPassword",
        "ParameterValue": "{{dbPassword}}"
    },
    {
        "ParameterKey": "AccessCIDR",
        "ParameterValue": "10.0.0.0/0"
    },
    {
        "ParameterKey": "DBMultiAZ",
        "ParameterValue": "{{multiAzDB}}"
    },
    {
        "ParameterKey": "DBInstanceClass",
        "ParameterValue": "db.t2.large"
    },
    {
        "ParameterKey": "DBIops",
        "ParameterValue": "1000"
    },
    {
        "ParameterKey": "DBPassword",
        "ParameterValue": "{{dbPassword}}"
    },
    {
        "ParameterKey":"QSS3BucketName",
        "ParameterValue":"aws-quickstart"
    },
    {
        "ParameterKey":"QSS3KeyPrefix",
        "ParameterValue":"{{&productPrefix}}"
    }
]`

exports.jiraAsiParams = jiraAsiParams;
exports.confluenceAsiParams = confluenceAsiParams;
exports.bitbucketAsiParams = bitbucketAsiParams;