import Raven from 'raven'
import axios from 'axios'

export default async (obj, args, ctx) => {
  try {
    // const googleMaps = require('@google/maps').createClient({
    //   key: process.env.GOOGLE_API_KEY,
    //   Promise: global.Promise,
    // })

    // const {
    //   json: { predictions },
    // } = await googleMaps
    //   .placesAutoComplete({
    //     input: args.query,
    //     language: 'en',
    //     types: '(cities)',
    //   })
    //   .asPromise()
    const predictions = await placesAutoComplete(args.query)

    if (typeof predictions !== 'undefined' && predictions.length > 0) {
      return predictions.map(({ description, place_id }) => {
        return { description, placeId: place_id }
      })
    } else {
      return []
    }
  } catch (e) {
    Raven.captureException(e)
    return []
  }
}

const placesAutoComplete = async (city) => {
  try {
    // https://therepm-server-v2.fly.dev/placesAutoComplete?city=Kabul
    const url = `https://therepm-server-v2.fly.dev/placesAutoComplete?city=${city}`
    const res = await axios.get(url)
    const zoneData = res.data
    if (zoneData.ok === true) {
      return zoneData.zones
    } else {
      return undefined
    }
  } catch (error) {
    return undefined
  }
}
