import { listClusters } from '../utils'

// Generic validations
export const valueExists = async ({ value }) => {
  return !!value
}

export const isGreaterThanZero = ({ value }) => {
  return parseInt(value) > 0
}

// Creating clusters - only cluster names that do not currently exist are accepted
export const isClusterNameValid = async ({ awsCreds, value }) => {
  const clusters = await listClusters()
  const isUniqueClusterName = !clusters.includes(value)

  return !!value && isUniqueClusterName
}

// Deleting clusters - only cluster names that actually exist should be accepted
export const isClusterNameToDeleteValid = async ({ value, awsCreds }) => {
  const clusters = await listClusters()
  const clusterExists = clusters.includes(value)

  return (!!value && clusterExists)
}

export const validateMaxNodes = ({ value, minNodes }) => {
  return parseInt(value) > parseInt(minNodes)
}

