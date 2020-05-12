import { ux } from '@cto.ai/sdk'
import { ClusterSettings, AWSCreds } from '../types'
import { confirmPrompt } from '../prompts'
import { startSpinner } from '../utils'
import { Terraform, track, pExec } from '.'
import { CONFIGS_DIR } from '../constants'

const { green, bold, magenta } = ux.colors

export class Cluster {
  settings: ClusterSettings;
  awsCreds: AWSCreds;
  constructor({ settings, awsCreds }) {
    this.settings = settings
    this.awsCreds = awsCreds
  }

  get terraform() {
    const { clusterName, logTypes, enableContainerInsights } = this.settings
    const { AWS_ACCOUNT_NUMBER, AWS_DEFAULT_REGION, AWS_PROFILE } = this.awsCreds

    return new Terraform({
      awsCreds: this.awsCreds,
      accountNumber: AWS_ACCOUNT_NUMBER,
      clusterName,
      region: AWS_DEFAULT_REGION,
      profile: AWS_PROFILE,
      logTypes,
      enableContainerInsights,
    })
  }

  get settingsJson() {
    // Make sure double quotes in the JSON string are escaped
    return JSON.stringify(this.settings).replace(/\"/g, '\\"')
  }

  async confirmSettings() {
    const { users, clusterName, logTypes, enableContainerInsights } = this.settings
    const { AWS_DEFAULT_REGION, AWS_ACCOUNT_NUMBER } = this.awsCreds
    // TODO: Add support for multiple worker groups
    const worker = this.settings.workers[0]
    const usersWithAccess = users ? `you, ${users.join(', ')}` : 'you'

    let settings = [
      magenta('\n🔧 Basic Settings'),
      `AWS account number: \`${green(AWS_ACCOUNT_NUMBER)}\``,
      `AWS region: \`${green(AWS_DEFAULT_REGION)}\``,
      `EKS cluster name: \`${green(clusterName)}\``,
      `Users with access: \`${green(usersWithAccess)}\``,
      magenta('\n👷 Worker Group Settings'),
      `Size of worker nodes: \`${green(worker.instance_type)}\``,
      `Detailed monitoring enabled: \`${green(`${worker.enable_monitoring}`)}\``,
      `Autoscaling enabled: \`${green(`${worker.autoscaling_enabled}`)}\``,
      `Desired number of nodes: \`${green(`${worker.asg_desired_capacity}`)}\``,
    ]
    if (logTypes.length) {
      settings.push(
        `EKS Control Plane log types enabled: \`${green(`${logTypes.join(', ')}`)}\``
      )
    }
    if (enableContainerInsights) {
      settings.push(
        `EKS Container Insights enabled: \`${green(`${enableContainerInsights}`)}\``
      )
    }
    if (worker.autoscaling_enabled) {
      settings = settings.concat([
        `Minimum number of nodes: \`${green(`${worker.asg_min_size}`)}\``,
        `Maximum number of nodes: \`${green(`${worker.asg_max_size}`)}\``,
      ])
    }
    settings.push('\n')
    await ux.print(settings.join('\n'))
  }

  async onCreated() {
    const { clusterName, users } = this.settings
    const { AWS_DEFAULT_REGION } = this.awsCreds

    const { stdout: clusterEndpoint } = await pExec(`terraform output cluster_endpoint`, { cwd: CONFIGS_DIR })
    const { stdout: bastionPublicDns } = await pExec(`terraform output bastion_public_dns`, { cwd: CONFIGS_DIR })

    const bastionUrl = `https://${AWS_DEFAULT_REGION}.console.aws.amazon.com/ec2/v2/home?region=${AWS_DEFAULT_REGION}#Instances:search=${clusterName}-bastion;sort=instanceId`

    const instructions = [
      bold(green(`\n🚀  Cluster \`${clusterName}\` successfully created in region \`${AWS_DEFAULT_REGION}\`.`)),
      bold(`\n☁️  Before you can connect to the bastion using SSH, you need to connect to the bastion using EC2 Instance Connect and authorize your public key.`),
      bold(`\n🔗  Go to EC2 & click on "Connect": ${bastionUrl}`),
      bold(`💻  Once connected to the bastion EC2 instance, run \`echo "<public_key_content>" >> ~/.ssh/authorized_keys\``),
      bold('❗️  Now, from your local computer, you can use the following command to connect to the cluster via SSH using the equivalent private key:'),
      magenta(`\`ssh -i <path_to_private_key_filename> -L 12345:${clusterEndpoint.trim().replace('https://','')}:443 ec2-user@${bastionPublicDns.trim()}\``)
    ]
    await ux.print(instructions.join('\n'))

    if (users && users.length) {
      await ux.print(
        bold(`\n💻  Access to this cluster has been shared with: \`${green(users.join(', '))}\`\n`),
      )
    }

    await track({ event: 'Cluster create complete', action: 'create', ...this.settings })
  }

  async create() {
    const { terraform, settingsJson } = this
    await ux.print(bold('\nThese are the settings you have selected for your cluster:'))

    try {
      await this.confirmSettings()
      const { confirm } = await ux.prompt(confirmPrompt)
      ux.print('\n')
      if (confirm !== 'yes') return

      await startSpinner('Creating cluster')
      await ux.print('\n')

      await terraform.createStateS3Bucket()
      await terraform.configure()
      await terraform.init()
      await terraform.apply({ settingsJson, onComplete: this.onCreated.bind(this) })
    } catch (error) {
      await track({
        event: 'Error creating cluster',
        error: JSON.stringify(error),
        ...this.settings,
      })
    }
  }

  async destroy() {
    const { terraform, settingsJson } = this
    try {
      await terraform.configure()
      await terraform.init()
      await terraform.pullState()
      await terraform.destroy({ settingsJson })
    } catch (error) {
      await track({
        event: 'Error destroying cluster',
        error: JSON.stringify(error),
        ...this.settings,
      })
    }
  }
}
