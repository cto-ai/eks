import { sdk } from '@cto.ai/sdk'
import { TrackingData } from '../types'

export const track = async (trackingData: TrackingData) => {
  try {
    const metadata = {
      event: `EKS Cluster Op - ${trackingData.event}`,
      ...trackingData
    }
    await sdk.track(['track', 'provision.sh', 'eks'], metadata)
  } catch (err) {
    // Uncomment for debugging--otherwise it will produce a lot of text
    // await ux.print(err.response)
  }
}
