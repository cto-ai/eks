provider "aws" {
  region  = var.region
  profile = var.profile
  version = "~> 2.33.0"
}
