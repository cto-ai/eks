// TODO: dynamically create security groups depending on # workers needed by the user
resource "aws_security_group" "worker_group_mgmt" {
  name_prefix = "worker_group_mgmt"
  description = "EKS cluster - Worker Nodes + Bastion"
  vpc_id      = module.vpc.vpc_id

  tags = {
    "Name" = "${var.clusterName}-eks_worker_nodes_sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "eks_ssh_bastion_worker_ingress" {
  description       = "Allow SSH access from the bastion."
  protocol          = "tcp"
  security_group_id = aws_security_group.worker_group_mgmt.id
  from_port         = 22
  to_port           = 22
  type              = "ingress"
  source_security_group_id = aws_security_group.bastion.id
}

resource "aws_security_group_rule" "eks_https_bastion_worker_ingress" {
  description       = "Allow HTTPS access from the bastion."
  protocol          = "tcp"
  security_group_id = aws_security_group.worker_group_mgmt.id
  from_port         = 443
  to_port           = 443
  type              = "ingress"
  source_security_group_id = aws_security_group.bastion.id
}

# resource "aws_security_group" "all_worker_mgmt" {
#   name_prefix = "all_worker_management"
#   description = "EKS cluster - Worker Nodes"
#   vpc_id      = module.vpc.vpc_id

#   lifecycle {
#     create_before_destroy = true
#   }
# }

# resource "aws_security_group_rule" "eks_ssh_vpc_worker_ingress" {
#   description       = "Allow SSH access from within the VPC."
#   protocol          = "tcp"
#   security_group_id = aws_security_group.all_worker_mgmt.id
#   from_port         = 22
#   to_port           = 22
#   type              = "ingress"
#   cidr_blocks = [
#       "10.0.0.0/16"
#   ]
# }
