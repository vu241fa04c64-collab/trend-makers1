import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import wardrobeRoutes from './routes/wardrobe.js'
import outfitRoutes from './routes/outfits.js'
import calendarRoutes from './routes/calendar.js'
import weatherRoutes from './routes/weather.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '12mb' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/wardrobe', wardrobeRoutes)
app.use('/api/outfits', outfitRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/weather', weatherRoutes)
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' })
})

const port = process.env.PORT || 4000
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.')
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wearwise')
  .then(() => app.listen(port, () => console.log(`Trend Makers API listening on ${port}`)))
  .catch((error) => {
    console.error('Unable to connect to MongoDB:', error.message)
    process.exit(1)
  })
