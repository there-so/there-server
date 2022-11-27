import Storage from '@google-cloud/storage'
import fetch from 'node-fetch'
import shortid from 'shortid'
import path from 'path'
import fs from 'fs'

const gcs = new Storage({
  projectId: 'there-192619',
  // CHANGED THIS PASS FROM ../../secrets/
  
  // coolify
  credentials: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  } : undefined,

  // render
  keyFilename: !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? path.join(__dirname, '../../There-552ddaf22779.json') : undefined,
})

const isProd = process.env.NODE_ENV === 'production'
const bucketName = 'there-192619.appspot.com'
const bucket = gcs.bucket(bucketName)

const getPublicUrl = pathToFile => {
  return encodeURI(`https://storage.googleapis.com/${bucketName}/${pathToFile}`)
}

export const uploadToStorageMiddleware = () => (req, res, next) => {
  if (!req.file) {
    return next()
  }

  const userId = req.userId || ''

  let extension = path.extname(req.file.originalname)
  // Remove query from extension
  if (extension.includes('?')) {
    extension = extension.split('?')[0]
  }

  const fileName = shortid.generate()
  const fileUniqueName = `${fileName}${extension}`
  const pathToFile = path.join('users/', userId, fileUniqueName)
  const file = bucket.file(pathToFile)

  const stream = file.createWriteStream({
    contentType: req.file.mimetype,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
    public: true,
  })

  stream.on('error', err => {
    req.file.cloudStorageError = err
    next(err)
  })

  stream.on('finish', () => {
    req.file.cloudStorageObject = pathToFile
    req.file.cloudStoragePublicUrl = getPublicUrl(pathToFile)
    next()
  })

  stream.end(req.file.buffer)
}

export const uploadToStorageFromUrl = (userId, photoUrl) =>
  new Promise(async (resolve, reject) => {
    if (!userId || !photoUrl) {
      return reject(
        new Error(
          `User Id or URL is missing. Values => userId: ${userId} photoUrl: ${photoUrl}`,
        ),
      )
    }

    let photoBody
    try {
      const { ok, body } = await fetch(photoUrl)

      if (!ok) {
        return reject(new Error(`Request for fetching image failed`))
      }

      photoBody = body
    } catch (err) {
      return reject(err)
    }

    // TODO: Abstract this part and use in both uploader functions
    let extension = path.extname(photoUrl)
    // Remove query from extension
    if (extension.includes('?')) {
      extension = extension.split('?')[0]
    }

    const fileName = shortid.generate()
    const fileUniqueName = `${fileName}${extension}`
    const pathToFile = path.join('users/', userId, fileUniqueName)
    const file = bucket.file(pathToFile)

    const stream = file.createWriteStream({
      contentType: 'auto',
      public: true,
    })

    stream.on('error', err => {
      reject(err)
    })

    stream.on('finish', () => {
      resolve({ cloudObject: pathToFile, publicUrl: getPublicUrl(pathToFile) })
    })

    photoBody.pipe(stream)
  })
