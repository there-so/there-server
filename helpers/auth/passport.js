import passport from 'passport'
import path from 'path'

// Local
import { twitterStrategy } from './twitter'
import { jwtStrategy, encodeJwt } from './jwt'
import { serializeUser, deserializeUser } from './session'
import { generateRandomPhrase } from '../../utils/randomPhrase'
import {
  encode as jwtSimpleEncode,
  decode as jwtSimpleDecode,
} from 'jwt-simple'
import config from '../../utils/config'
import { User } from '../../models'
import { uploadGravatarToStorage, signInUserByEmail } from './email'
import { loginAnonymously } from './anonymous'
import { sendEmailVerification } from '../email'

const { JWT_SECRET } = process.env

/**
 * Setup authentication with PassportJS
 *
 * @param {Express} app
 * @param {SocketIO.Server} io
 */
export const setupPassportAuth = (app, io) => {
  passport.serializeUser(serializeUser)
  passport.deserializeUser(deserializeUser)

  passport.use(twitterStrategy(io))
  passport.use(jwtStrategy)

  app.use(passport.initialize())
  app.use(passport.session())

  ///////// TWITTER ///////////
  app.get(
    '/auth/twitter',
    // Save socketId in the session
    (req, res, next) => {
      req.session.socketId = req.query.socketId
      next()
    },
    passport.authenticate('twitter'),
  )
  app.get(
    '/auth/twitter/callback',
    passport.authenticate('twitter'),
    async (req, res) => {
      // Get client's socketId from session
      const socket = io.to(req.session.socketId)
      // Check if sign in failed
      if (!req.user && !req.user.id) {
        socket.emit('signin-failed')
        // Wait to finish socket
        await sleep(200)
        res.send(
          `Connecting failed for some reason, probably our fault. Please try again and make sure you give us permission (hit 'Accept').`,
        )
        return
      }
      // Then it was successful...
      // Generate JWT token
      const jwtToken = encodeJwt(req.user.id)
      // Send token to client
      socket.emit('signin-succeeded', { jwtToken, user: req.user })
      // Wait to finish socket
      await sleep(200)
      // And close the window
      res.render('twitter-connected')
    },
  )

  ///////// EMAIL ///////////
  app.post('/auth/email', async (req, res) => {
    const { email, socketId } = req.body

    // Check for socketId to save for use in callback later
    if (!socketId) {
      res.json({
        sent: false,
        message: 'No socket. Live support at there.team',
      })
      return
    }

    if (email) {
      const securityCode = generateRandomPhrase()
      const halfHourInSeconds = 1800
      const token = jwtSimpleEncode(
        {
          email: email.toLowerCase(),
          nbf: Date.now() / 1000,
          exp: Date.now() / 1000 + halfHourInSeconds,
        },
        JWT_SECRET,
      )
      const callbackUrl = `${
        config.apiUrl
      }/auth/email/callback?socketId=${socketId}&token=${token}`

      // Send verification email
      try {
        const res = await sendEmailVerification(email, {
          securityCode,
          callbackUrl,
        })
      } catch (err) {
        res.json({ sent: false, message: err.message })
      }

      res.json({ sent: true, securityCode })
    } else {
      res.json({ sent: false, message: 'No email provided.' })
    }
  })
  app.get('/auth/email/callback', signInUserByEmail(io), async (req, res) => {
    // Get client's socketId from query
    const socket = io.to(req.query.socketId)
    // Check if sign in failed
    if (!req.user && !req.user.id) {
      socket.emit('signin-failed')
      // Wait to finish socket
      await sleep(200)
      res.send(`Failed for some reason.`)
      return
    }
    // Then it was successful...
    // Generate JWT token
    const jwtToken = encodeJwt(req.user.id)
    // Send token to client
    socket.emit('signin-succeeded', { jwtToken, user: req.user })
    // Wait to finish socket
    await sleep(200)
    // And close the window
    res.render('email-verified')
  })

  ///////// JWT ///////////
  app.get('/auth/jwt', passport.authenticate('jwt'), (req, res) => {
    res.send(`userId: ${req.userId}`)
  })

  ///////// ANONYMOUS ///////////
  app.post('/auth/anonymous', loginAnonymously)
}

function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration))
}
