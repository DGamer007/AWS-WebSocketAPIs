# Steps to Setup the Project Development Environment

1\*- If you are **Admin** then...

- you must have an AWS Root User Account.
- Create an IAM Role for yourself and get the _AccessKeyId_ and _SecretAccessKey_ for the Role.

> To Create an IAM Role...
>
> 1- Log into AWS Root User Account >
>
> 2- Profile dropdown menu(top right corner) > Security Credentials > Access Management > Users > Add Users
>
> **OR**
>
> 2- Search for IAM Service > Access Management > Users > Add Users

1\*- If you are not Admin then...

- Ask for _AccessKeyId_ and _SecretAccessKey_ of your IAM role to Admin.

2- Install [AWS-CLI](https://aws.amazon.com/cli), [SAM-CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) on your Machine.

3- After successful installation of AWS-CLI run '`aws configure`' command in terminal and pass _AccessKeyId_ and _SecretAccessKey_ in prompts.

4- Use `sam build` command to build the resources/changes done locally.

5- Use `sam deploy` to push changes to AWS CloudFormation Stack.

> [AWS ToolKit](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-toolkit-vscode) is the extension for VSCode that might come in handy for Debugging Serverless Functions, etc.
