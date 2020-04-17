<img align="right" width="260" height="447" src="https://github.com/3CORESec/AWS-MIRROR-TOOLKIT/raw/master/assets/imgs/mirror-officer-mascot-small.png">

# AWS AutoMirror

Part of the [AWS Mirror Toolkit](https://github.com/3CORESec/aws-mirror-toolkit), AutoMirror is a project that automatically creates AWS traffic mirror sessions. It allows configuration via AWS Tags and helps you manage big deployments of traffic mirror sessions. 

[![image](https://img.shields.io/badge/AutoMirror-1.0.0-GREEN)](#)
[![image](https://img.shields.io/badge/BuiltOn-AWS-orange)](#)
[![Open Source Love svg1](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)

## How does it work?

3CS AWS AutoMirror is an AWS Lambda function that will monitor the state of your EC2 instances. When instances are created *(or rebooted)* this information will be passed over to AutoMirror, which will check if the particular instance holds a specific tag *(Mirror=True)*. If it does, and if the instance is of the supported type, AutoMirror will create a mirror session.  

## How do I install it?

As of **1.0.0**, 3CS AutoMirror is officially available in the **AWS Serverless Application Repository 🎉

In the region where you'd like to deploy AutoMirror, visit the **Serverless Application Repository** *(in AWS Console, just search for it in the Services section)* and head over to **Available Applications**. 

Search for **AutoMirror** *(make sure to enable "show apps that create custom IAM roles or resources policies)* and click on deploy.

## How do I run it?

After deployment of the app is complete, just tag any instance with **Mirror=True** to trigger AutoMirror in creating the mirror sessions.

**Warning:** Traffic Mirror Sessions are only available in Nitro-based instances, so AutoMirror will only create mirror sessions for supported EC2 instance types. Check [this article](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html#ec2-nitro-instances) for a list of Nitro-based instances.

## Requirements

### Mirror Filter

If a **Mirror Filter** does not exist, AutoMirror will create a filter that mirrors all of the traffic. If a Mirror Filter exists, AutoMirror will use the existing filter. 

You can also tag which filter you'd like to use. Read the **Controlling AutoMirror** section for more information.

### Mirror Target

We assume the user already created at least 1 **Mirror Target**, as AutoMirror will not do that for you. 

In environments with more than 1 **Mirror Target**, AutoMirror will create sessions evenly amongst the existing targets, giving users a load-balancing feature.

You can also tag which target you'd like to use. Read the **Controlling AutoMirror** section for more information.

## Controlling AutoMirror

If you want to have more control over how AutoMirror creates its sections, we make two options available via tags.

- Mirror-Target
- Mirror-Filter

**Example tags on EC2 creation:**

- Mirror-Target=tmt-0cf51cb49550a6000
- Mirror-Filter=tmf-037045da20bff1511

Check this [image](./Imgs/advanced-tags.png) for an example of the tags in use.

# Security

## Application Security

AutoMirror is open-source and its code is available [here](./Code/index.js). You can verify for yourself what the application will do. 

## Deployment Security

Regarding the deployment of the application in your account, all components and steps are defined in the AWS SAM [template](./Code/template.yaml). As you can verify for yourself, the development of the template is a lot more complex than it could be.

We purposely developed the template so anything related to AutoMirror is **clearly** identified and labeled in your account. There are no random strings in the resources that are deployed.

# Feedback

Found this interesting? Have a question/comment/request? Let us know! 

Feel free to open an [issue](https://github.com/3CORESec/aws-automirror/issues) or ping us on [Twitter](https://twitter.com/3CORESec).

[![Twitter](https://img.shields.io/twitter/follow/3CORESec.svg?style=social&label=Follow)](https://twitter.com/3CORESec)

# How do I remove AutoMirror from my account?

Head over to AWS CloudFormation and select AutoMirror. Click on **Delete**. All resources deployed for AutoMirror will be deleted from your account. This will not remove the mirror sessions. 

# ToDo

Check the [issues](https://github.com/3CORESec/aws-automirror/issues) to know what we're working on. 