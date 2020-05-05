data "aws_availability_zones" "azs" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "2.21.0"

  name = "eks-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.azs.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  enable_nat_gateway     = true
  one_nat_gateway_per_az = true
  enable_vpn_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true

  tags = {
    "Name"                                     = "${var.clusterName}-node"
    "kubernetes.io/cluster/${var.clusterName}" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.clusterName}" = "shared"
    "kubernetes.io/role/elb"                   = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${var.clusterName}" = "shared"
    "kubernetes.io/role/internal-elb"          = "1"
  }
}
