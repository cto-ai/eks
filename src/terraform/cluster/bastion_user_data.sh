#!/usr/bin/env bash

##############
# Install deps
##############
yum update -y
yum install -y curl

# epel provides python-pip & jq
yum install -y epel-release
yum install python-pip jq -y

pip install --upgrade awscli

cat <<"EOF" > /home/${ssh_user}/.ssh/config
Host *
    StrictHostKeyChecking no
EOF

##############
# Aliases
##############
echo 'alias k="kubectl"' >> /home/${ssh_user}/.bashrc
source /home/${ssh_user}/.bashrc