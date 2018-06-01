import Raven from 'raven'

import { ManualPerson } from '../models'
import getTzAndLoc from '../helpers/google/getTzAndLoc'
import followingList from './followingList'

export default async (
  obj,
  { firstName, lastName, twitterHandle, placeId, photoUrl, photoCloudObject },
  ctx,
  info,
) => {
  // Find timezone and exact location based on placeId
  const { city, fullLocation, timezone } = await getTzAndLoc(placeId)

  // Create and save place
  const savedPerson = await ManualPerson.create({
    firstName,
    lastName,
    twitterHandle,
    photoUrl,
    photoCloudObject,

    city,
    fullLocation,
    timezone,
  })

  try {
    await ctx.user.addManualPerson(savedPerson)
  } catch (err) {
    Raven.captureException(err)
    console.log(err)
    return err
  }

  return savedPerson.get({ plain: true })
}
