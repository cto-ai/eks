data "aws_ami" "custom_ami" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  owners = ["137112412989"] # owned by AWS
}

resource "tls_private_key" "bastion" {
  algorithm   = "RSA"
  rsa_bits    = 4096
}

resource "aws_key_pair" "bastion" {
  key_name   = "${var.clusterName}-key"
  public_key = tls_private_key.bastion.public_key_openssh
}

data "template_file" "bastion_user_data" {
  template = "${file("${path.module}/bastion_user_data.sh")}"

  vars = {
    ssh_user                    = "ec2-user"
    host                        = module.eks.cluster_endpoint
  }
}

# TODO switch to autoscaling? 
resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.custom_ami.id
  instance_type               = "t2.micro"
  key_name                    = aws_key_pair.bastion.key_name
  subnet_id                   = module.vpc.public_subnets[0]
  vpc_security_group_ids      = ["${aws_security_group.bastion.id}"]
  associate_public_ip_address = true
  user_data                   = data.template_file.bastion_user_data.rendered

  root_block_device {
    volume_size           = 10 # in GB - default is 8GB
    delete_on_termination = true
  }

  tags = {
    Name = "${var.clusterName}-bastion"
  }
}
