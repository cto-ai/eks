import { listClusters } from '../utils'

// Generic validations
export const isGreaterThanZero = ({ value }) => {
  return value > 0
}

// Creating clusters - only cluster names that do not currently exist are accepted
export const isClusterNameValid = async ({ value }) => {
  const clusters = await listClusters()
  const isUniqueClusterName = !clusters.includes(value)

  return !!value && isUniqueClusterName
}

// Deleting clusters - only cluster names that actually exist should be accepted
export const isClusterNameToDeleteValid = async ({ value }) => {
  const clusters = await listClusters()
  const clusterExists = clusters.includes(value)

  return !!value && clusterExists
}

export const validateMaxNodes = ({ value, minNodes }) => {
  return value > minNodes
}
