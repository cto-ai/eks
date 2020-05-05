resource "aws_security_group" "bastion" {
  name        = "${var.clusterName}-bastion"
  description = "Allow SSH access to bastion host and outbound internet access"
  vpc_id      = module.vpc.vpc_id
}

// Allow ssh access from your workstation [for now]
resource "aws_security_group_rule" "ssh" {
  protocol          = "TCP"
  from_port         = 22
  to_port           = 22
  type              = "ingress"
  cidr_blocks       = ["0.0.0.0/0"] # TODO change
  security_group_id = aws_security_group.bastion.id
}

resource "aws_security_group_rule" "internet" {
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  type              = "egress"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion.id
}

resource "aws_security_group_rule" "intranet" {
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  type              = "egress"
  cidr_blocks       = [module.vpc.vpc_cidr_block]
  security_group_id = aws_security_group.bastion.id
}
