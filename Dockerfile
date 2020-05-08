############################
# Build container
############################
FROM node:12-alpine AS dep

WORKDIR /ops

ADD package.json .
RUN npm install --production

ADD . .

############################
# Final container
############################
FROM registry.cto.ai/official_images/node:2-12.13.1-stretch-slim

WORKDIR /ops

ENV AWS_CLI_VERSION=1.18.52
RUN apt-get update \
        && apt-get install -y --no-install-recommends make curl wget unzip ca-certificates openssh-client python-pip python-setuptools python-wheel \
        && pip install --no-cache-dir awscli==${AWS_CLI_VERSION} \
        && apt-get purge -y python-pip python-setuptools \
        && apt-get autoremove -y \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists

# Terraform
ENV TF_VERSION=0.12.19
RUN wget --quiet https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_amd64.zip \
    && unzip terraform_${TF_VERSION}_linux_amd64.zip \
    && mv terraform /usr/bin \
    && rm terraform_${TF_VERSION}_linux_amd64.zip

ENV AWS_CONFIG_FILE="/ops/.aws/config" AWS_SHARED_CREDENTIALS_FILE="/ops/.aws/credentials"

COPY --from=dep --chown=9999:9999 /ops .
