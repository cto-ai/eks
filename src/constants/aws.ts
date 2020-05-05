import * as path from 'path'
export const ROOT_DIR = '/root'
export const CREDS_DIR = path.resolve(ROOT_DIR, 'creds')
export const AWS_DIR = path.resolve(process.env.HOME || '', '.aws')

// Regions that are enabled by default & currently support EKS
const regionCodes = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-2': 'US West (Oregon)',
  // 'ap-east-1': 'Asia Pacific (Hong Kong)', - requires user opt-in
  'ap-south-1': 'Asian Pacific (Mumbai)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  // 'ap-northeast-2': 'Asia Pacific (Seoul)', - limited support
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-southeast-2': 'Asia Pacific (Sydney)',
  'eu-central-1': 'EU (Frankfurt)',
  // 'eu-north-1': 'EU (Stockholm)', - has restricted instance types
  'eu-west-1': 'EU (Ireland)',
  'eu-west-2': 'EU (London)',
  'eu-west-3': 'EU (Paris)',
  // 'me-south-1': 'Middle East (Bahrain)', - requires user opt-in
  'sa-east-1': 'South America (São Paulo)',
}

export const AWS_REGIONS = Object.keys(regionCodes)

// Source: https://aws.amazon.com/ec2/instance-types
export const AWS_INSTANCE_SIZES = [
  't2.nano',
  't2.micro',
  't2.small',
  't2.medium',
  't2.large',
  't2.xlarge',
  't2.2xlarge',
  't3.nano',
  't3.micro',
  't3.small',
  't3.medium',
  't3.large',
  't3.xlarge',
  't3.2xlarge',
  't3a.nano',
  't3a.micro',
  't3a.small',
  't3a.medium',
  't3a.large',
  't3a.xlarge',
  't3a.2xlarge',
  'm4.large',
  'm4.xlarge',
  'm4.2xlarge',
  'm4.4xlarge',
  'm4.10xlarge',
  'm4.16xlarge',
  'm5.large',
  'm5.xlarge',
  'm5.2xlarge',
  'm5.4xlarge',
  'm5.8xlarge',
  'm5.12xlarge',
  'm5.16xlarge',
  'm5.24xlarge',
  'm5.metal',
  'm5a.large',
  'm5a.xlarge',
  'm5a.2xlarge',
  'm5a.4xlarge',
  'm5a.8xlarge',
  'm5a.12xlarge',
  'm5a.16xlarge',
  'm5a.24xlarge',
  'm5ad.large',
  'm5ad.xlarge',
  'm5ad.2xlarge',
  'm5ad.4xlarge',
  'm5ad.8xlarge',
  'm5ad.12xlarge',
  'm5ad.16xlarge',
  'm5ad.24xlarge',
  'm5d.large',
  'm5d.xlarge',
  'm5d.2xlarge',
  'm5d.4xlarge',
  'm5d.8xlarge',
  'm5d.12xlarge',
  'm5d.16xlarge',
  'm5d.24xlarge',
  'm5d.metal',
  'm5n.large',
  'm5n.xlarge',
  'm5n.2xlarge',
  'm5n.4xlarge',
  'm5n.8xlarge',
  'm5n.12xlarge',
  'm5n.16xlarge',
  'm5n.24xlarge',
  'm5dn.large',
  'm5dn.xlarge',
  'm5dn.2xlarge',
  'm5dn.4xlarge',
  'm5dn.8xlarge',
  'm5dn.12xlarge',
  'm5dn.16xlarge',
  'm5dn.24xlarge',
]

// Number of EIPs that are created by the Terraform EKS module by default
const NUM_EIP_NEEDED = 3

const NUM_VPC_NEEDED = 1

const DEFAULT_NO_OF_VPC_PER_REGION = 5
const DEFAULT_NO_OF_EC2_PER_REGION = 20
const DEFAULT_NO_OF_EIP_PER_REGION = 5

export const RESOURCE_LIMITS = {
  vpc: {
    name: 'VPC',
    command: `aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId]' --output text | wc -l`,
    limit: DEFAULT_NO_OF_VPC_PER_REGION,
    needed: NUM_VPC_NEEDED,
  },
  // Number of needed EC2 instances needs to be calculated
  ec2: {
    name: 'EC2 instance',
    command: `aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId]' --output text | wc -l`,
    limit: DEFAULT_NO_OF_EC2_PER_REGION,
  },
  eip: {
    name: 'Elastic IP',
    command: `aws ec2 describe-addresses --query 'Addresses[*].[AllocationId]' --output text | wc -l`,
    limit: DEFAULT_NO_OF_EIP_PER_REGION,
    needed: NUM_EIP_NEEDED,
  },
}

export const CLUSTER_ACTIVE_DELETED = 'DELETED'

export const EKS_CONTROL_PLANE_LOG_TYPES = ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler']
