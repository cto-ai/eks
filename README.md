![CTO Banner](https://cto.ai/static/oss-banner.png)

# EKS Op

An Op that facilitates the creation and destruction of [EKS](https://aws.amazon.com/eks/) (Amazon Elastic Kubernetes Service) clusters.

Note: The Op currently supports only clusters with **private topology**, where access to the cluster is managed through the use of a **bastion host**.

This op has been built and tested only with EKS private topology clusters.

## Requirements

### Ops Platform

Running this op requires you to have access to the [Ops Platform](https://cto.ai/platform). Please review the [documentation](https://cto.ai/docs/overview) for detailed instructions on how to install the Ops CLI and/or Ops Slack application.

### AWS Credentials

❗️ **Please consider running this op in a test environment before running it in a production enviroment.**

Before running the op, please set the AWS credentials as secrets, following the instructions below. In order for the op to automatically retrieve these secrets, please reference the details below for the exact key names you should use when storing them. If the auto-match fails, the op users will be prompted to select an option from the available list of secrets every time they run the op.

`AWS_ACCOUNT_NUMBER`

Please refer to [this URL](https://docs.aws.amazon.com/general/latest/gr/acct-identifiers.html) for instructions on how to find your AWS Account Number. Once identified, run the following command to save it as a secret in your Ops team:

```sh
ops secrets:set -k AWS_ACCOUNT_NUMBER -v <VALUE>
```

* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

This op is built to create/destroy EKS clusters leveraging AWS IAM authenticator. To use this op, we recommend you create a dedicated machine user with programmatic access enabled. The following policy captures all the permissions required for all of the features in this op to function as expected:

```{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateDhcpOptions",
                "ec2:AuthorizeSecurityGroupIngress",
                "iam:List*",
                "ec2:CreateKeyPair",
                "ec2:AttachInternetGateway",
                "iam:PutRolePolicy",
                "iam:AddRoleToInstanceProfile",
                "ec2:UpdateSecurityGroupRuleDescriptionsIngress",
                "ec2:DeleteRouteTable",
                "ec2:DeleteVpnGateway",
                "ec2:RevokeSecurityGroupEgress",
                "ec2:CreateRoute",
                "ec2:CreateInternetGateway",
                "ec2:DeleteInternetGateway",
                "iam:DeleteOpenIDConnectProvider",
                "ec2:Associate*",
                "autoscaling:DeleteTags",
                "iam:GetRole",
                "iam:GetPolicy",
                "ec2:ImportKeyPair",
                "ec2:CreateTags",
                "iam:DeleteRole",
                "ec2:RunInstances",
                "ec2:StopInstances",
                "ec2:AssignPrivateIpAddresses",
                "ec2:CreateVolume",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:CreateNetworkInterface",
                "autoscaling:AttachInstances",
                "ec2:DeleteDhcpOptions",
                "ec2:DeleteNatGateway",
                "autoscaling:DeleteAutoScalingGroup",
                "iam:GetOpenIDConnectProvider",
                "ec2:CreateSubnet",
                "iam:GetRolePolicy",
                "ec2:ModifyVpcEndpoint",
                "autoscaling:DetachInstances",
                "iam:CreateInstanceProfile",
                "logs:ListTagsLogGroup",
                "ec2:CreateNatGateway",
                "iam:TagRole",
                "ec2:CreateVpc",
                "ec2:ModifySubnetAttribute",
                "iam:PassRole",
                "ec2:CreateDefaultSubnet",
                "iam:DeleteRolePolicy",
                "ec2:DeleteLaunchTemplateVersions",
                "iam:DeleteInstanceProfile",
                "ec2:ReleaseAddress",
                "ec2:DeleteLaunchTemplate",
                "s3:*",
                "iam:CreatePolicy",
                "autoscaling:CreateLaunchConfiguration",
                "ec2:Describe*",
                "iam:CreateServiceLinkedRole",
                "ec2:CreateLaunchTemplate",
                "ec2:Disassociate*",
                "iam:UpdateAssumeRolePolicy",
                "iam:GetPolicyVersion",
                "ec2:DeleteSubnet",
                "iam:RemoveRoleFromInstanceProfile",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "ec2:DeleteVolume",
                "iam:DetachRolePolicy",
                "ec2:GetLaunchTemplateData",
                "autoscaling:UpdateAutoScalingGroup",
                "ec2:DetachVolume",
                "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
                "autoscaling:SetDesiredCapacity",
                "ec2:CreateRouteTable",
                "ec2:DeleteNetworkInterface",
                "autoscaling:SuspendProcesses",
                "ec2:DetachInternetGateway",
                "logs:CreateLogGroup",
                "autoscaling:CreateOrUpdateTags",
                "iam:DeleteServiceLinkedRole",
                "ec2:DeleteVpc",
                "ec2:CreateEgressOnlyInternetGateway",
                "eks:*",
                "ec2:DeleteKeyPair",
                "autoscaling:CreateAutoScalingGroup",
                "autoscaling:Describe*",
                "ec2:DeleteTags",
                "iam:DeletePolicy",
                "ec2:CreateSecurityGroup",
                "ec2:ModifyVpcAttribute",
                "iam:CreatePolicyVersion",
                "ec2:AuthorizeSecurityGroupEgress",
                "ec2:DeleteEgressOnlyInternetGateway",
                "ec2:TerminateInstances",
                "ec2:DetachNetworkInterface",
                "iam:GetInstanceProfile",
                "logs:DescribeLogGroups",
                "logs:DeleteLogGroup",
                "ec2:DeleteRoute",
                "ec2:AllocateAddress",
                "ec2:CreateLaunchTemplateVersion",
                "iam:CreateOpenIDConnectProvider",
                "autoscaling:DeleteLaunchConfiguration",
                "ec2:DeleteSecurityGroup",
                "ec2:ModifyLaunchTemplate",
                "ec2:AttachNetworkInterface",
                "logs:PutRetentionPolicy"
            ],
            "Resource": "*"
        }
    ]
}
```

Please refer to [this URL](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys) for instructions and best practices on how to generate these access keys. Once ready, run the following commands to save them as secrets in your Ops team, replacing `<value>` with your value:

```sh
ops secrets:set -k AWS_ACCESS_KEY_ID -v <value>
ops secrets:set -k AWS_SECRET_ACCESS_KEY -v <value>
```

## Usage

### CLI

```sh
ops run eks
```

### Slack

```
/ops run eks
```

## Features

### Create cluster

- Private topology (will create a bastion host inside the VPC; all access to the cluster will happen through the bastion host)
- Configure worker nodes instance types
- Configure detailed monitoring for instances (y/n, incurs additional costs)
- Configure autoscaling (y/n) and min/max nodes
- Configure EKS Control Plane Logging (y/n, incurs additional costs)
- Configure EKS Container Insights (y/n, incurs additional costs)

### Destroy cluster

- Select existing cluster
- Destroy all associated resources, incl. bastion host

## Contributing

See the [Contributing Docs](CONTRIBUTING.md) for more information.

## Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/choww"><img src="https://avatars0.githubusercontent.com/u/6757505?s=100" width="100px;" alt=""/><br /><sub><b>Carmen Chow</b></sub></a><br/></td>
    <td align="center"><a href="https://github.com/ruxandrafed"><img src="https://avatars2.githubusercontent.com/u/11021586?s=100" width="100px;" alt=""/><br /><sub><b>Ruxandra Fediuc</b></sub></a><br/></td>
  </tr>
</table>

## License

[MIT](LICENSE)
