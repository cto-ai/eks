data "aws_caller_identity" "current" {}

locals {
  additionalUsers = [for user in var.users :
    {
      userarn  = "arn:aws:iam::${var.accountNumber}:user/${user}"
      username = user
      groups   = ["system:masters"]
    }
  ]

  currentUser = [{
    userarn  = data.aws_caller_identity.current.arn
    username = "admin"
    groups   = ["system:masters"]
  }]

  users = concat(local.additionalUsers, local.currentUser)
}

locals {
  workers = [for index, worker in var.workers :
    {
      name                          = "worker-${index}"
      instance_type                 = worker.instance_type
      autoscaling_enabled           = worker.autoscaling_enabled
      asg_desired_capacity          = worker.asg_desired_capacity
      asg_max_size                  = worker.asg_max_size
      asg_min_size                  = worker.asg_min_size
      enable_monitoring             = worker.enable_monitoring
      key_name                      = aws_key_pair.bastion.key_name
      additional_security_group_ids = [aws_security_group.worker_group_mgmt.id]
    }
  ]
}

resource "aws_security_group_rule" "eks_https_bastion_ingress" {
  description              = "Allow HTTPS access from bastion host."
  protocol                 = "tcp"
  security_group_id        = module.eks.cluster_security_group_id
  source_security_group_id = aws_security_group.bastion.id
  from_port                = 443
  to_port                  = 443
  type                     = "ingress"
}

resource "aws_security_group_rule" "eks_ssh_bastion_ingress" {
  description              = "Allow SSH access from bastion host."
  protocol                 = "tcp"
  security_group_id        = module.eks.cluster_security_group_id
  source_security_group_id = aws_security_group.bastion.id
  from_port                = 22
  to_port                  = 22
  type                     = "ingress"
}

// TODO: Upadate to more recent version v11.1.0 with support for cluster_version v1.15
// See: https://github.com/terraform-aws-modules/terraform-aws-eks/commit/7dc56e976bf0f8c48820085a4cdee37e676ca2b8#diff-c9ac8098c5ea9d3e6a9a596ff0c512a4
// TODO: Add support for managed node groups: https://aws.amazon.com/blogs/containers/eks-managed-node-groups/
// See: https://github.com/terraform-aws-modules/terraform-aws-eks/blob/master/examples/managed_node_groups/main.tf
module "eks" {
  source                = "terraform-aws-modules/eks/aws"
  version               = "7.0.1"
  cluster_name          = var.clusterName
  # config_output_path  = "${pathexpand(var.kubeconfigDirectory)}/"
  write_kubeconfig      = false
  write_aws_auth_config = false

  kubeconfig_aws_authenticator_env_variables = {
    AWS_PROFILE = var.profile
  }

  subnets = module.vpc.private_subnets
  vpc_id  = module.vpc.vpc_id

  worker_groups = local.workers

  # worker_additional_security_group_ids = [aws_security_group.all_worker_mgmt.id]
  map_roles = [{
    rolearn  = aws_iam_role.worker-node.arn
    username = "system.node:{{EC2PrivateDNSName}}"
    groups   = ["system:bootstrappers", "system:nodes"]
  }]

  map_users    = local.users
  map_accounts = [var.accountNumber]

  cluster_enabled_log_types = var.logTypes

  // Private access only
  cluster_endpoint_public_access  = false
  cluster_endpoint_private_access = true
  # Create but don't automatically apply the aws-auth configmap file
  manage_aws_auth = false

  # Timeouts, defaults are 15m
  cluster_create_timeout = "30m"
  cluster_delete_timeout = "30m"
}