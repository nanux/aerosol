const jiraProductParams = `[
    {
        "ParameterKey": "InternetFacingLoadBalancer",
        "ParameterValue": "true"
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
        "ParameterValue": "0.0.0.0/0"
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
        "ParameterKey": "ClusterNodeInstanceType",
        "ParameterValue": "t3.medium"
    },
    {
        "ParameterKey": "DBInstanceClass",
        "ParameterValue": "db.t3.medium"
    }
]`

const confluenceProductParams = `[
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
    "ParameterValue": "0.0.0.0/0"
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

exports.jiraProductParams = jiraProductParams;
exports.confluenceProductParams = confluenceProductParams;
