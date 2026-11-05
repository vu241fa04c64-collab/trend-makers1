import jwt from 'jsonwebtoken'

export default function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' })
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
    next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}
