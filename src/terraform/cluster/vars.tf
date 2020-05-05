variable "accountNumber" {
  type        = string
  description = "AWS account number"
}

variable "aws" {
  type = object({
    accessKey = string
    secretKey = string
  })
  description = "AWS access key & secret access key"
}

variable "profile" {
  type = string
}

variable "region" {
  type = string
}

variable "s3Bucket" {
  default = "eks-cluster-terraform-state"
  type    = string
}

variable "clusterName" {
  default = "eks"
  type    = string
}

variable "kubeconfigDirectory" {
  default     = "~/.kube/"
  type        = string
  description = "Specify the directory in which the kubeconfig file should be stored"

}

variable "environment" {
  default = "development"
  type    = string
}

variable "numWorkers" {
  default = 1
  type    = number
}

variable "workers" {
  default = []
  type = list(object({
    instance_type        = string
    autoscaling_enabled  = bool
    asg_desired_capacity = number
    asg_min_size         = number
    asg_max_size         = number
    enable_monitoring    = bool
  }))
}

variable "users" {
  default     = []
  type        = list(string)
  description = "List of users with access to the cluster"
}

variable "logTypes" {
  default     = []
  type        = list(string)
  description = "EKS Control Plane log types enabled"
}

variable "enableContainerInsights" {
  default     = false
  type        = bool
  description = "Flag to enable/disable EKS Container Insights"
}
