resource "aws_iam_role" "worker-node" {
  name = "${var.clusterName}-worker"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY

}

resource "aws_iam_role_policy_attachment" "worker-node-policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.worker-node.name
}

resource "aws_iam_role_policy_attachment" "eks-cni-policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.worker-node.name
}

resource "aws_iam_role_policy_attachment" "ec2-registry-readonly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.worker-node.name
}

resource "aws_iam_instance_profile" "worker-node" {
  name = "${var.clusterName}-worker"
  role = aws_iam_role.worker-node.name
}

# EKS Container Insights
resource "aws_iam_role_policy_attachment" "eks-container-insights" {
  policy_arn  = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  role        = module.eks.worker_iam_role_name
}
