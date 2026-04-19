import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import albumRoutes from './routes/albums.js'
import authRoutes from './routes/auth.js'
import User from './models/User.js'

const app = express()

app.use(express.json())
app.use(express.static('public'))

// session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

// passport setup
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email })
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' })
      }
      const isCorrect = await user.comparePassword(password)
      if (!isCorrect) {
        return done(null, false, { message: 'Invalid email or password' })
      }
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

// routes
app.use('/api/albums', albumRoutes)
app.use('/api/auth', authRoutes)

// error handler
app.use((err, req, res, next) => {
  console.log(err)
  res.status(500).json({ msg: err.message || 'Something went wrong' })
})

export default app