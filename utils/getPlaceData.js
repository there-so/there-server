import axios from 'axios'

export const getPlaceData = async (place_id) => {
  try {
    // const url = `https://therepm-server-v2.fly.dev/getPlaceData?place_id=${place_id}`
    const url = `https://there-time.usenoor.com/getPlaceData?place_id=${place_id}`
    const res = await axios.get(url)
    const zoneData = res.data
    if (zoneData.ok === true) {
      return zoneData
    } else {
      return undefined
    }
  } catch (error) {
    return undefined
  }
}
