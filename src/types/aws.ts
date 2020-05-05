export type AWSConfig = {
  profile: string,
  accountNumber: string,
  accessKeyId: string
  accessKeySecret: string
  region: string
}

export type PromptAnswer = {
  clusterNamep?: string
  instance_type?: string
  autoscaling_enabled?: string
  asg_desired_capacity?: number
  enable_monitoring?: string
  confirmAddUsers?: string
}

export type AWSCreds = {
  AWS_PROFILE,
  AWS_DEFAULT_REGION,
  AWS_ACCOUNT_NUMBER,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
}