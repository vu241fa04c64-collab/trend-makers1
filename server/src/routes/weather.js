import { Router } from 'express'
import requireAuth from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/', async (req, res) => {
  const city = req.query.city?.trim()
  if (!city) return res.status(400).json({ message: 'Enter a city to check the weather.' })
  if (!process.env.OPENWEATHER_API_KEY) return res.status(503).json({ message: 'Live weather is not configured. Choose weather manually instead.' })
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`)
    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ message: data.message || 'Unable to retrieve weather for this city.' })
    res.json({ city: data.name, temperature: Math.round(data.main.temp), condition: data.weather[0].main, description: data.weather[0].description, humidity: data.main.humidity })
  } catch {
    res.status(502).json({ message: 'Weather service is unavailable. Choose weather manually instead.' })
  }
})
export default router
