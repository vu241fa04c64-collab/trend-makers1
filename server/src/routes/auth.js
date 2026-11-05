import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ClothingItem, User } from '../models.js'
import requireAuth from '../middleware/auth.js'
import { starterWardrobe } from '../starter-wardrobe.js'

const router = Router()
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, preferences: user.preferences })
const issueToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
      return res.status(400).json({ message: 'Enter your name, a valid email, and a password of at least 8 characters.' })
    }
    if (await User.exists({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'An account with this email already exists.' })
    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      password: await bcrypt.hash(password, 12),
      wardrobeCatalogVersion: 11
    })
    try {
      await ClothingItem.insertMany(starterWardrobe.map((item) => ({ ...item, user: user._id })))
    } catch (error) {
      await ClothingItem.deleteMany({ user: user._id })
      await User.deleteOne({ _id: user._id })
      throw error
    }
    res.status(201).json({ token: issueToken(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() })
    if (!user || !await bcrypt.compare(req.body.password || '', user.password)) return res.status(401).json({ message: 'Email or password is incorrect.' })
    res.json({ token: issueToken(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'Account not found.' })
    res.json(publicUser(user))
  } catch (error) { next(error) }
})

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, city, style } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name cannot be empty.' })
    const user = await User.findByIdAndUpdate(req.userId, {
      name: name.trim(),
      'preferences.city': city?.trim() || '',
      'preferences.style': style || ''
    }, { new: true, runValidators: true }).select('-password')
    res.json(publicUser(user))
  } catch (error) { next(error) }
})

export default router
