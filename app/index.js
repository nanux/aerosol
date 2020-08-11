/*
 * Lists EC2 instances for a provided region. 
 * Only those instances which are running and
 * are tagged with 'ClusterNodeGroup' are returned
 */
const mustache = require('mustache')
const emoji = require('node-emoji');
const figlet = require('figlet');
const chalk = require('chalk');
const AWS = require("aws-sdk");
const inquirer = require('inquirer');
const _ = require('lodash');
const fuzzy = require('fuzzy');
const ora = require('ora');
const spinner = ora();

const rocket = emoji.get('rocket');
const cloud = emoji.get('sun_behind_cloud');
const tada = emoji.get('tada');
const details = emoji.get('zap');
const seeNoEvil = emoji.get('see_no_evil');
const hearNoEvil = emoji.get('hear_no_evil');
const key = emoji.get('key');
const thinking = emoji.get('thinking_face');
const sparkles = emoji.get('sparkles');
const skull = emoji.get('skull_and_crossbones');
const warning = emoji.get('warning');
const earth = emoji.get('earth_africa');
const computer = emoji.get('computer');
const pancakes = emoji.get('pancakes');
const construction = emoji.get('construction');
const check = emoji.get('white_check_mark');
const action = emoji.get('zap');
const one = emoji.get('one');
const two = emoji.get('two');
const three = emoji.get('three');
const four = emoji.get('four');
const five = emoji.get('five');
const six = emoji.get('six');
const seven = emoji.get('seven');
const eight = emoji.get('eight');

const azs = [];
const targetInstances = [];
let availableStacks = [];
let capturedInstance = {};
let availableInstances = [];
const awsDetails = {}

const regions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'ap-south-1',
    'ca-central-1',
    'ap-northeast-1',
    'ap-southeast-2',
    'ap-southeast-1',
    'ap-northeast-2',
    'eu-central-1',
    'sa-east-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
]

const SSM_START_SESSION = 'ssm start-session';
const CREATE_STACK = 'create stack';
const DELETE_CFN_STACK = 'delete stack';
const STACK_STATUS = 'stack status';

const stackTypes = [
    'Jira',
    'BitBucket',
    'Confluence',
    'Crowd'
]

let asiParams = new Map([
    ['Jira', require('./stackAssets/asiParams').jiraAsiParams],
    ['Confluence', require('./stackAssets/asiParams').confluenceAsiParams], //Conf diff by one param
    // ['BitBucket', jiraAsiParams], //BB diff
    ['Crowd', require('./stackAssets/asiParams').jiraAsiParams], //Crowd same as Jira
])

let productParams = new Map([
    ['Jira', require('./stackAssets/productParams').jiraProductParams]
])

let asiTemplateMap = new Map([
    ['Jira', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-jira/templates/quickstart-jira-dc-with-vpc.template.yaml'],
    ['Confluence', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-confluence/templates/quickstart-confluence-master-with-vpc.template.yaml'],
    ['BitBucket', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-bitbucket/templates/quickstart-bitbucket-dc-with-vpc.template.yaml'],
    ['Crowd', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-crowd/templates/quickstart-crowd-dc-with-vpc.template.yaml'],
]);

let productTemplateMap = new Map([
    ['Jira', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-jira/templates/quickstart-jira-dc.template.yaml'],
    ['Confluence', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-confluence/templates/quickstart-confluence-master.template.yaml'],
    ['BitBucket', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-bitbucket/templates/quickstart-bitbucket-dc.template.yaml'],
    ['Crowd', 'https://aws-quickstart.s3.amazonaws.com/quickstart-atlassian-crowd/templates/quickstart-crowd-dc.template.yaml'],
])

let productPrefixes = new Map([
    ['Jira', 'quickstart-atlassian-jira/'],
    ['Confluence', 'quickstart-atlassian-confluence/'],
    ['BitBucket', 'quickstart-atlassian-bitbucket/'],
    ['Crowd', 'quickstart-atlassian-crowd/'],
])

const awsActions = [
    SSM_START_SESSION,
    CREATE_STACK,
    STACK_STATUS,
    DELETE_CFN_STACK
]

/* 
 * For now only interested in the following states
 */
const listStackParams = {
    StackStatusFilter: [
        'CREATE_IN_PROGRESS',
        'CREATE_FAILED',
        'CREATE_COMPLETE',
        'ROLLBACK_IN_PROGRESS',
        'ROLLBACK_FAILED',
        'ROLLBACK_COMPLETE',
        'DELETE_IN_PROGRESS',
        'DELETE_FAILED',
        'UPDATE_COMPLETE',
        'DELETE_COMPLETE',
        'UPDATE_IN_PROGRESS',
        'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
        'UPDATE_COMPLETE',
        'UPDATE_ROLLBACK_COMPLETE'
    ]
};

figlet.text('Aerosol', {
    font: 'block',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: true
}, function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }

    // console.log(emoji.emoji)
    console.log(chalk.yellow(`${data}`));
    console.log(chalk.yellow(`\t\t\t\t\     Cloud in a can `))
    console.log(chalk.yellow(`\t\t\t\t\     a DC-Deployments production `))
    console.log(chalk.yellow(`\t\t\t\t\t\t\   version 1.0.0`))
    // console.log(chalk.yellow(`\t\t\t\t\t\t\       ${sparkles}${sparkles}${sparkles}`))
    console.log('\n')
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
    inquirer
        .prompt([
            {
                type: 'autocomplete',
                name: 'region',
                message: `${earth} Select a region:`,
                pageSize: 6,
                source: searchRegions
            },
            {
                type: 'rawlist',
                name: 'action',
                message: `${action} Select an action:`,
                choices: awsActions
            },
        ])
        .then((answers) => {
            awsDetails.region = answers.region;
            awsDetails.action = answers.action;
            AWS.config.update({region: awsDetails.region});
            loadAvailabilityZones()
            AWS.config.getCredentials(function (err) {
                if (err) console.log(chalk.red(`Could not obtain AWS credentials`), err);
                else {
                    switch (awsDetails.action) {
                        case SSM_START_SESSION:
                            ssmSession();
                            break;
                        case CREATE_STACK:
                            createStack();
                            break;
                        case STACK_STATUS:
                            stackStatus();
                            break;
                        case DELETE_CFN_STACK:
                            deleteStack();
                            break;
                        default:
                            console.log(`More to come.`)
                    }
                }
            });
        })
});

/*
 * Retrieve basic params and build. Many params 
 * are defaulted. For now the ExportPrefix is 
 * always defaulted to `ATL-`
 */
function createStack() {
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'productStack',
                message: `${one}  Select product:`,
                choices: stackTypes
            },
            {
                type: 'list',
                name: 'deploymentType',
                message: `${two}  Select a deployment type:`,
                choices: ['Deploy into a new ASI', 'Deploy into an existing ASI']
            },
            {
                type: 'input',
                name: 'stackName',
                message: `${three}  Provide a stack name:`,
            },
            {
                type: 'password',
                name: 'dbPassword',
                mask: true,
                message: `${four}  Provide a DB password (used for user & admin):`,
            },
            {
                type: 'confirm',
                name: 'multiAzDB',
                message: `${five}  Multi AZ DB deployment?:`,
            },
            {
                type: 'checkbox',
                checked: true,
                name: 'availabilityZones',
                message: `${six}  Select at least two AZ's:`,
                choices: azs,
                when: function (answers) {
                    return answers.deploymentType === 'Deploy into a new ASI';
                },
            },
            {
                type: 'confirm',
                name: 'enableTerminationMitigation',
                message: `${seven}  Prevent stack termination or shutdown?:`,
            },
            {
                type: 'confirm',
                name: 'terminationProtection',
                message: `${seven}  Enable termination protection?:`,
                when: function (answers) {
                    return answers.enableTerminationMitigation;
                },
            },
            {
                type: 'confirm',
                name: 'applyAntiShutDownTags',
                message: `${eight}  Enable shutdown protection?:`,
                when: function (answers) {
                    return answers.enableTerminationMitigation;
                },
            },
        ])
        .then((answers) => {
            answers.productPrefix = productPrefixes.get(answers.productStack)
            const cloudformation = new AWS.CloudFormation();
            const params = {
                StackName: `${answers.stackName}`,
                Capabilities: [
                    'CAPABILITY_IAM'
                ],
                DisableRollback: true,
                EnableTerminationProtection: JSON.parse(`${(answers.terminationProtection === 'true')}`),
                Parameters: JSON.parse(mustache.render(answers.deploymentType === 'Deploy into a new ASI' 
                    ? asiParams.get(answers.productStack) 
                    : productParams.get(answers.productStack), answers)),
                TemplateURL: answers.deploymentType === 'Deploy into a new ASI'
                    ? asiTemplateMap.get(answers.productStack)
                    : productTemplateMap.get(answers.productStack),
            };
            if (answers.applyAntiShutDownTags) {
                params.Tags = [
                    {
                        "Key": "Name",
                        "Value": `${answers.productStack}-aerosol-deployment`
                    },
                    {
                        "Key": "business_unit",
                        "Value": 'DC-Deployments'
                    },
                    {
                        "Key": "service_name",
                        "Value": `${answers.productStack}`
                    },
                    {
                        "Key": "resource_owner",
                        "Value": 'DC-Deployments'
                    }
                ]
            }
            console.log(params)
            cloudformation.createStack(params, function (err, data) {
                if (err) handlerError(err)
                else {
                    console.log(chalk.green(`${rocket} Preparing for deployment...`))
                    getStackStatus(answers)
                }
            });
        })
}

function stackStatus() {
    availableStacks = [];
    const cloudformation = new AWS.CloudFormation();
    cloudformation.listStacks(listStackParams, function (err, data) {
        availableStacks = [];
        if (err) handlerError(err);
        else {
            data.StackSummaries.forEach(stack => {
                availableStacks.push(stack.StackName);
            })
            if (availableStacks.length === 0) {
                console.log(chalk.green(`${seeNoEvil} No active stacks for region ${awsDetails.region}`))
                process.exit()
            }
            inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
            inquirer
                .prompt([
                    {
                        type: 'autocomplete',
                        name: 'stackName',
                        message: `${pancakes} Select a stack:`,
                        pageSize: 20,
                        source: searchStacks
                    }
                ])
                .then((answer) => {
                    getStackStatus(answer);
                })
        }
    });
}

function ssmSession() {
    const ec2 = new AWS.EC2();
    const params = {
        //Filter instances belonging to an AWS QS Stack
        Filters: [
            {
                Name: "tag:aws:cloudformation:logical-id",
                Values: [
                    "ClusterNodeGroup"
                ]
            }
        ]
    };
    ec2.describeInstances(params, function (err, data) {
        if (err) handlerError(err)
        else {
            data.Reservations.forEach(reservation => {
                targetInstances.push(reservation.Instances.filter(instance => instance.State.Name === 'running'))
            });
            targetInstances.forEach(instance => {
                if (instance.length > 0) {
                    capturedInstance.instanceId = instance[0].InstanceId
                    capturedInstance.name = instance[0].Tags.filter(tag => tag.Key === 'Name')[0].Value;
                    availableInstances.push(capturedInstance)
                    capturedInstance = {}
                }
            })
        }
        if (availableInstances.length > 0) {
            inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'ec2Instance',
                        message: `${computer} Select an EC2 instance:`,
                        choices: availableInstances
                    },
                ])
                .then((answers) => {
                    let instanceId = availableInstances.filter(instance => instance.name === answers.ec2Instance)[0].instanceId
                    const sessionCommand = `aws ssm start-session --target ${instanceId} --region ${awsDetails.region}`
                    console.log(chalk.green(`${details} Using session details: ${sessionCommand}`))
                    console.log(chalk.green(`${rocket} Launching SSM session now... `));
                    let spawn = require('child_process').spawn;
                    spawn('aws', ['ssm', 'start-session', "--target", instanceId, "--region", awsDetails.region], {stdio: 'inherit'});
                })
        } else {
            console.log(chalk.yellow(`${seeNoEvil} No running EC2 instances found for ${awsDetails.region}`))
        }
    })
}

function deleteStack() {
    const cloudformation = new AWS.CloudFormation();
    cloudformation.listStacks(listStackParams, function (err, data) {
        availableStacks = [];
        if (err) handlerError(err);
        else {
            data.StackSummaries.forEach(stack => {
                availableStacks.push(stack.StackName);
            })
            if (availableStacks.length === 0) {
                console.log(chalk.green(`${seeNoEvil} No active stacks for region ${awsDetails.region}`))
                process.exit()
            }
            inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
            inquirer
                .prompt([
                    {
                        type: 'autocomplete',
                        name: 'stackName',
                        message: `${pancakes} Select a stack to delete:`,
                        pageSize: 20,
                        source: searchStacks
                    },
                    {
                        type: 'confirm',
                        name: 'confirmStackDeletion',
                        message: `${warning}  Are you sure you want to delete this stack?`,
                    }
                ])
                .then((answers) => {
                    console.log(answers.confirmStackDeletion)
                    if (answers.confirmStackDeletion) {
                        const params = {
                            StackName: `${answers.stackName}`
                        };
                        cloudformation.deleteStack(params, function (err, data) {
                            if (err) handlerError(err)
                            else {
                                console.log(chalk.green(`Preparing to delete stack [${answers.stackName}] now...`))
                                getStackStatus(answers)
                            }
                        });
                    } else {
                        process.exit()
                    }
                })
        }
    });
}

function handlerError(err) {
    switch (err.code) {
        case 'RequestExpired':
            console.log(chalk.red(`${key} Your AWS credentials have expired. Authenticate to AWS using your favoured mechanism and update ~/.aws/credentials accordingly`));
            process.exit()
            break;
        case 'ExpiredToken':
            console.log(chalk.red(`${key} Your security token has expired. Authenticate to AWS using your favoured mechanism and update ~/.aws/credentials accordingly`));
            process.exit()
            break;
        case 'ValidationError':
            console.log(chalk.red(`${warning}  ${err.message}`));
            process.exit()
            break;
        case 'AlreadyExistsException':
            console.log(chalk.red(`${hearNoEvil} ${err.message}!`));
            process.exit()
            break;
        default:
            console.log(`${thinking} Not sure how to deal with this error: ${err}`)
    }
}

function searchRegions(answers, input) {
    input = input || '';
    return new Promise(function (resolve) {
        setTimeout(function () {
            var fuzzyResult = fuzzy.filter(input, regions);
            resolve(
                fuzzyResult.map(function (el) {
                    return el.original;
                })
            );
        }, _.random(30, 500));
    });
}

function searchStacks(answers, input) {
    input = input || '';
    return new Promise(function (resolve) {
        setTimeout(function () {
            var fuzzyResult = fuzzy.filter(input, availableStacks);
            resolve(
                fuzzyResult.map(function (el) {
                    return el.original;
                })
            );
        }, _.random(30, 500));
    });
}

function getStackStatus(answer) {
    const cloudformation = new AWS.CloudFormation();
    const params = {
        StackName: `${answer.stackName}`
    };
    setInterval(() => cloudformation.describeStacks(params, function (err, data) {
        if (err) {
            handlerError(err);
        } else {
            switch (data.Stacks[0].StackStatus) {
                case 'CREATE_COMPLETE':
                    console.log(chalk.green(`\n  ${check} creation complete for stack: ${answer.stackName} `));
                    process.exit()
                    break;
                case 'DELETE_COMPLETE':
                    console.log(data.Stacks[0])
                    console.log(chalk.green(`\n  ${check} deletion complete for stack: ${answer.stackName} `));
                    process.exit()
                    break;
                case 'CREATE_FAILED':
                    console.log(chalk.red(`\n${seeNoEvil} stack creation failed for: ${answer.stackName}. Check AWS Console for more details`));
                    process.exit()
                    break;
                case 'CREATE_IN_PROGRESS':
                    setTimeout(() => {
                        spinner.start();
                        spinner.color = 'yellow';
                        spinner.text = chalk.green(`${construction} Stack [${answer.stackName}] creation in progress...`);
                    }, 1000);
                    break;
                case 'DELETE_IN_PROGRESS':
                    setTimeout(() => {
                        spinner.start();
                        spinner.color = 'yellow';
                        spinner.text = chalk.green(`${skull}  Stack [${answer.stackName}] deletion in progress...`);
                    }, 1000);
                    break;
                default:
                    console.log(chalk.red(`${thinking} not sure what the current status is for: ${answer.stackName}`));
                    process.exit()
                    break;
            }

        }
    }), 5000);
}

function loadAvailabilityZones() {
    const ec2 = new AWS.EC2();
    ec2.describeAvailabilityZones(function (err, data) {
        if (err) console.log(err, err.stack);
        else data.AvailabilityZones.forEach(zone => {
            azs.push(zone.ZoneName)
        });
    });
}
