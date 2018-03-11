import { ManualPerson } from '../models'
import getTzAndLoc from '../helpers/google/getTzAndLoc'

export default async (
  obj,
  { firstName, lastName, twitterHandle, placeId, photoUrl },
  ctx,
) => {
  // Find timezone and exact location based on placeId
  const { city, fullLocation, timezone } = await getTzAndLoc(placeId)

  // Create and save place
  const savedPerson = await ManualPerson.create({
    firstName,
    lastName,
    twitterHandle,
    photoUrl,

    city,
    fullLocation,
    timezone,
  })

  await ctx.user.addManualPerson(savedPerson)

  return savedPerson.get({ plain: true })
}
