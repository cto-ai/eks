############################
# Build container
############################
FROM node:10-alpine AS dep

WORKDIR /ops

ADD package.json .
RUN npm install --production

ADD . .

############################
# Final container
############################
FROM registry.cto.ai/official_images/node:2-12.13.1-stretch-slim AS final

WORKDIR /ops

RUN apt update && apt install -y make curl wget unzip ca-certificates openssh-client

# Terraform
ENV TF_VERSION=0.12.19
RUN wget --quiet https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_amd64.zip \
    && unzip terraform_${TF_VERSION}_linux_amd64.zip \
    && mv terraform /usr/bin \
    && rm terraform_${TF_VERSION}_linux_amd64.zip

# Pyhton
RUN apt update \
    && apt install python-pip -y 

# AWS CLI
ENV AWS_CLI_VERSION=1.18.52
RUN pip install --no-cache-dir awscli==${AWS_CLI_VERSION} \
    && apt purge python-pip -y \
    && apt clean ls

# Clean up
RUN apt purge python-pip -y \
    && apt clean ls

ENV AWS_CONFIG_FILE="/ops/.aws/config" AWS_SHARED_CREDENTIALS_FILE="/ops/.aws/credentials"

COPY --from=dep /ops .

RUN chown -R 9999 /ops && chgrp -R 9999 /ops

# USER 9999:9999