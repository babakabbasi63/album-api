// ─── Check if user is logged in via session ───────────────────────────────────
// passport adds isAuthenticated() method to req
// if session exists → pass to next controller
// if no session → return 401
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    res.status(401).json({ msg: 'Please log in to access this route' })
  }
  
  export { isAuthenticated }