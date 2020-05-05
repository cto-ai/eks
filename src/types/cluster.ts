import { AWSCreds } from './aws';

export interface DefaultWorkerSettings {
  asg_desired_capacity: number
  asg_min_size: number | null
  asg_max_size: number | null
}

export interface workerSettings extends DefaultWorkerSettings {
  instance_type: string
  autoscaling_enabled: boolean
  enable_monitoring: boolean
}

export type ClusterSettings {
  clusterName: string
  // numWorkers: number // TODO: uncomment when ready to support
  awsCreds: AWSCreds
  resource: string
  workers: workerSettings[]
  logTypes: string[]
  enableContainerInsights: boolean
  users?: any
}

export type TfConfigs {
  settingsJson?: string
  onComplete: () => void
}
