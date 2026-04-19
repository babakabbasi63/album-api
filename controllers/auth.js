import User from '../models/User.js'
import passport from 'passport'

// ─── Register ──────
const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body

    // check all fields present
    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        msg: 'Please provide name, email, password and password confirmation'
      })
    }

    // check passwords match
    if (password !== passwordConfirm) {
      return res.status(400).json({ msg: 'Passwords do not match' })
    }

    // check duplicate email
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already registered' })
    }

    // create user — password hashed by pre-save hook
    const user = await User.create({ name, email, password })

    res.status(201).json({
      msg: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

// ─── Login ─────
// passport.authenticate verifies email and password
// on success it calls req.login() which creates the session
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err)

    // wrong email or password
    if (!user) {
      return res.status(401).json({
        msg: info.message || 'Invalid email or password'
      })
    }

    // create the session
    req.login(user, (err) => {
      if (err) return next(err)
      res.status(200).json({
        msg: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    })
  })(req, res, next)
}

// ─── Logout ────
// destroys the session completely
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Error logging out' })
    }
    req.session.destroy()
    res.status(200).json({ msg: 'Logged out successfully' })
  })
}

export { register, login, logout }