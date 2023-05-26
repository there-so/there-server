import { ManualPlace } from '../models'
import getTzAndLoc from '../helpers/google/getTzAndLoc'
import followingList from './followingList'
import { getPlaceData } from '../utils/getPlaceData'

export default async (obj, args, ctx, info) => {
  const {
    name,
    timezone: inputTimezone,
    placeId,
    photoUrl,
    photoCloudObject,
  } = args

  // Find timezone and exact location based on placeId
  // let { city, fullLocation, timezone } = await getTzAndLoc(placeId)
  let placeData = await getPlaceData(placeId)
  if (!placeData) {
    Raven.captureException(err)
    console.log(err)
    return 'error adding'
  }

  let { city, fullLocation, timezone } = placeData

  // Used for UTC
  if (!placeId && !city && inputTimezone) {
    city = null
    fullLocation = null
    timezone = inputTimezone
  }

  // Create and save place
  const savedPlace = await ManualPlace.create({
    name,
    photoUrl,
    photoCloudObject,

    city,
    fullLocation,
    timezone,
  })

  try {
    await ctx.user.addManualPlace(savedPlace)
  } catch (err) {
    Raven.captureException(err)
    console.log(err)
    return err
  }

  return savedPlace.get({ plain: true })
}
