<img align="right" width="260" height="447" src="https://github.com/3CORESec/AWS-MIRROR-TOOLKIT/raw/master/assets/imgs/mirror-officer-mascot-small.png">

# AWS AutoMirror

Part of the [AWS Mirror Toolkit](https://github.com/3CORESec/aws-mirror-toolkit), AutoMirror is a project that automatically creates AWS traffic mirror sessions. It allows configuration via AWS Tags and helps you manage big deployments of traffic mirror sessions. 

[![image](https://img.shields.io/badge/AutoMirror-0.4-GREEN)](#)
[![image](https://img.shields.io/badge/BuiltOn-AWS-orange)](#)
[![Open Source Love svg1](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)

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
- Deploy the [Lambda function](./Code/index.js) in a Node.js 10 environemnt 
  - Configure a **30 second** timeout
  - Configure Concurrency to **1**
- Create a Cloudwatch Event Rule to trigger the Lambda function, using the following [event code](./Cloudwatch/AutoMirrorCloudwatch.json) and [image](./Imgs/cloudwatch-rule.png) for instructions
  - If you'd like for AutoMirror to run on schedule, change the Even Source [accordingly](./Imgs/cloudwatch-cron.png) 

## How do I run it?

After the installation steps are completed, just tag any instance with **Mirror=True** to trigger AutoMirror in creating the mirror sessions.

**Warning:** Traffic Mirror Sessions are only availabe in Nitro-based instances, so any creation of EC2 instances that are not powered by Nitro will not trigger AutoMirror. Check [this article](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html#ec2-nitro-instances) for a list of supported instance types.

## Requirements

### Mirror Filter

If a **Mirror Filter** does not exist, AutoMirror will create a filter that mirrors all of the traffic. If a Mirror Filter exists, AutoMirror will use the existing filter. 

You can also tag which filter you'd like to use. Read the **Controlling AutoMirror** section for more information.

### Mirror Target

We assume the user already created at least 1 **Mirror Target**, as AutoMirror will not do that for you. 

In environemnts with more than 1 **Mirror Target**, AutoMirror will create sessions evenly amongsts the existing targets, giving users a load-balancing feature.

You can also tag which target you'd like to use. Read the **Controlling AutoMirror** section for more information.

## Controlling AutoMirror

If you want to have more control over how AutoMirror creates its sections, we make two options available via tags.

- Mirror-Target
- Mirror-Filter

**Example tags on EC2 creation:**

- Mirror-Target=tmt-0cf51cb49550a6000
- Mirror-Filter=tmf-037045da20bff1511

Check this [image](./Imgs/advanced-tags.png) for an example of the tags in use.

# Feedback

Found this interesting? Have a question/comment/request? Let us know! 

Feel free to open an [issue](https://github.com/3CORESec/aws-automirror/issues) or ping us on [Twitter](https://twitter.com/3CORESec).

[![Twitter](https://img.shields.io/twitter/follow/3CORESec.svg?style=social&label=Follow)](https://twitter.com/3CORESec)

# ToDo

Check the [issues](https://github.com/3CORESec/aws-automirror/issues) to know what we're working on. 
