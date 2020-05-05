# Kubectl
resource "null_resource" "setup_kubectl" {
  connection {
    host        = aws_instance.bastion.public_ip
    user        = "ec2-user"
    private_key = tls_private_key.bastion.private_key_pem
  }

  provisioner "remote-exec" {
    inline = [
      "curl -o kubectl https://amazon-eks.s3-us-west-2.amazonaws.com/1.14.6/2019-08-22/bin/linux/amd64/kubectl",
      "chmod +x ./kubectl",
      "mkdir -p $HOME/bin && cp ./kubectl $HOME/bin/kubectl && export PATH=$HOME/bin:$PATH",
      "echo 'export PATH=$HOME/bin:$PATH' >> $HOME/.bashrc",
      "echo 'Setting up kubeconfig'",
      "mkdir $HOME/.kube && echo '${module.eks.kubeconfig}' >> $HOME/.kube/config",
      "echo 'Installing aws-iam-authenticator'",
      "curl -o aws-iam-authenticator https://amazon-eks.s3-us-west-2.amazonaws.com/1.14.6/2019-08-22/bin/linux/amd64/aws-iam-authenticator",
      "chmod +x ./aws-iam-authenticator",
      "cp ./aws-iam-authenticator $HOME/bin/aws-iam-authenticator && export PATH=$HOME/bin:$PATH",
      "echo 'export PATH=$HOME/bin:$PATH' >> $HOME/.bashrc",
      "echo 'Setting up AWS credentials'",
      "aws configure set --profile ${var.profile} aws_access_key_id ${var.aws.accessKey}",
      "aws configure set --profile ${var.profile} aws_secret_access_key ${var.aws.secretKey}",
      "aws configure set --profile ${var.profile} region ${var.region}",
      "echo 'Applying config map'",
      "echo '${module.eks.config_map_aws_auth}' >> $HOME/.kube/aws-auth-config-map.yaml",
      "kubectl apply -f $HOME/.kube/aws-auth-config-map.yaml",
      "echo 'Done'"
    ]
  }

  triggers = {
    kubeconfig_rendered = module.eks.kubeconfig
  }

  depends_on = [
    aws_instance.bastion
  ]

}

# Calico
resource "null_resource" "setup_calico" {
  connection {
    host        = aws_instance.bastion.public_ip
    user        = "ec2-user"
    private_key = tls_private_key.bastion.private_key_pem
  }

  provisioner "remote-exec" {
    inline = [
      "kubectl apply -f https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/release-1.5/config/v1.5/calico.yaml"
    ]
  }

  depends_on = [
    null_resource.setup_kubectl
  ]
}

# EKS Container Insights (Cloudwatch Agent as DaemonSet)
resource "null_resource" "setup_container_insights" {
  count = var.enableContainerInsights ? 1 : 0

  connection {
    host        = aws_instance.bastion.public_ip
    user        = "ec2-user"
    private_key = tls_private_key.bastion.private_key_pem
  }

  provisioner "remote-exec" {
    inline = [
      "curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/master/k8s-yaml-templates/quickstart/cwagent-fluentd-quickstart.yaml | sed 's/{{cluster_name}}/${var.clusterName}/;s/{{region_name}}/${var.region}/' | kubectl apply -f -"
    ]
  }

  depends_on = [
    null_resource.setup_kubectl
  ]
}
