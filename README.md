<img align="right" width="260" height="447" src="https://github.com/3CORESec/AWS-MIRROR-TOOLKIT/raw/master/assets/imgs/mirror-officer-mascot-small.png">

# AWS AutoMirror

Part of the [AWS Mirror Toolkit](https://github.com/3CORESec/aws-mirror-toolkit), AutoMirror is a project that automatically creates AWS traffic mirror sessions. It allows configuration via AWS Tags and helps you manage big deployments of traffic mirror sessions. 

![image](https://img.shields.io/badge/AutoMirror-0.1-GREEN)

## How does it work?

3CS AWS AutoMirror is a AWS Lambda function that has three modes of operation:

### Follow up to EC2 Instance creation

Launched as a follow up to a AWS CloudWatch Event every time a new instance is created. 

### On schedule

Launched on a schedule, that rotinetly looks for tagged instances that require a mirror session. This is useful for deployments that were done before deploying AutoMirror. 

### During a stop/start

If an instance was created and during instance creation the appropriate Tag wasn't specified, it's possible to set the Tag later and AutoMirror will execute after a stop/start. 

## How do I install it?

We've kept the configuration required to use AutoMirror as simple as possible. The following are pre-requisites:

- Create an [Execution Policy](./IAM/ExecutionPolicy.json) for the Lambda with a minimal set of permissions
- Deploy the [Lambda function](./Code/index.js) in a Node 10 environemnt with a >= 10 second timeout
- Create a Cloudwatch Event Rule to trigger the Lambda function, using the following [event code](./Cloudwatch/AutoMirrorCloudwatch.json) and [image](./Imgs/cloudwatch-rule.png) for instructions

## How do I run it?

After the installation steps are completed, just tag any instance with **Mirror=True** *(case sensitive)* for AutoMirror to kick in and create a session mirror for you.

**Warning:** Traffic Mirror Sessions are only availabe in Nitro-based instances, so any creation of EC2 instances that are not powered by Nitro will not trigger AutoMirror. Check [this article](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html#ec2-nitro-instances) for a list of supported instance types.

## Assumptions

We assume the user already created a Session Mirror Target and a Mirror Filter. On accounts with only one of each, AutoMirror will do everything for you. In environments with several Mirror Targets and Mirror Filters, please read the **Controlling AutoMirror** section. 

It is also important to mention that the Lambda function needs enough time to create all the sessions before it times out. We recommended changing the default timeout from 3 seconds to 10, as that will accomodate most deployments. In scenarios where you might be creating 20/30+ sessions at once, please adjust the timeout accordindly.

## Controlling AutoMirror

If you want to configure which **Mirror Target** and **Mirror Filter** AutoMirror should use, we made two tags available:

- mirrorTarget
- mirrorFilter

Through the usage of these tags you can have a more advanced control of AutoMirror. 

**Example tags on EC2 creation:**

- mirrorTarget=tmt-0cf51cb49550a6000
- mirrorFilter=tmf-037045da20bff1511

**Tags are case-sensitive**.  

# Feedback
Found this interesting? Have a question/comment/request? Let us know! 

Feel free to open an [issue](https://github.com/3CORESec/aws-automirror/issues) or ping us on [Twitter](https://twitter.com/3CORESec).

# ToDo

Check the [issues](https://github.com/3CORESec/aws-automirror/issues) to know what we're working on. 
