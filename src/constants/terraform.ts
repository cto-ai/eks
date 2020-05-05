export const CONFIGS_DIR = '/ops/src/terraform/cluster'

export const VARIABLE_FILENAME = 'input.tfvars.json'

export const CLUSTER_ACTIONS = {
  'Create a Cluster': 'create',
  // 'Update a Cluster': 'update',
  'Destroy a Cluster': 'destroy',
}

export const ACTION_ARGS = Object.values(CLUSTER_ACTIONS)

// Resource create/destroy states
export const CREATE_STATES = { start: 'Creating', wip: 'Still creating', end: 'Creation complete' }
export const DESTROY_STATES = { start: 'Destroying', wip: 'Still destroying', end: 'Destruction complete' }

// Terraform command completion states
export const TF_CREATE_COMPLETE = 'Apply complete'
export const TF_DESTROY_COMPLETE = 'Destroy complete'

// Map terraform resource names to user-friendly names
export const TF_RESOURCES = {
  'aws_vpc.this': 'VPC',
  'aws_eks_cluster.this': 'EKS cluster',
  // 'aws_nat_gateway.this': 'NAT gateway',
  // 'aws_route_table.': 'Route table',
  // 'aws_security_group.': 'Security group',
  // 'aws_iam_role': 'IAM configuration',
  'aws_autoscaling_group.workers': 'Workers',
  // 'null_resource.update_config_map_aws_auth': 'Kubernetes configuration',
  'aws_instance.bastion': 'Bastion',
  'null_resource.setup_kubectl': 'Kubectl resources',
  'null_resource.setup_calico': 'Calico resources',
  'null_resource.setup_container_insights': 'Container Insights resources',
}
