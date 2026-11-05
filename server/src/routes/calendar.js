import { Router } from 'express'
import { Outfit, OutfitCalendar, ClothingItem } from '../models.js'
import requireAuth from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)
router.get('/', async (req, res, next) => {
  try {
    const query = { user: req.userId }
    if (req.query.from || req.query.to) query.date = {}
    if (req.query.from) query.date.$gte = new Date(req.query.from)
    if (req.query.to) query.date.$lte = new Date(req.query.to)
    res.json(await OutfitCalendar.find(query).populate({ path: 'outfit', populate: { path: 'items' } }).sort({ date: 1 }))
  } catch (error) { next(error) }
})
router.post('/', async (req, res, next) => {
  try {
    const outfit = await Outfit.findOne({ _id: req.body.outfit, user: req.userId })
    if (!outfit) return res.status(404).json({ message: 'Choose a saved outfit from your collection.' })
    const date = new Date(req.body.date)
    if (Number.isNaN(date.getTime())) return res.status(400).json({ message: 'Choose a valid date.' })
    if (!req.body.allowMultiple && await OutfitCalendar.exists({ user: req.userId, date: { $gte: new Date(date.toDateString()), $lt: new Date(new Date(date.toDateString()).getTime() + 86400000) } })) {
      return res.status(409).json({ message: 'There is already an outfit planned for this date.' })
    }
    res.status(201).json(await (await OutfitCalendar.create({ user: req.userId, outfit: outfit._id, date })).populate({ path: 'outfit', populate: { path: 'items' } }))
  } catch (error) { next(error) }
})
router.put('/:id', async (req, res, next) => {
  try {
    const current = await OutfitCalendar.findOne({ _id: req.params.id, user: req.userId })
    if (!current) return res.status(404).json({ message: 'Calendar entry not found.' })
    if (req.body.outfit && !await Outfit.exists({ _id: req.body.outfit, user: req.userId })) return res.status(404).json({ message: 'Saved outfit not found.' })
    if (req.body.date) {
      const date = new Date(req.body.date)
      if (Number.isNaN(date.getTime())) return res.status(400).json({ message: 'Choose a valid date.' })
      const start = new Date(date.toDateString())
      const end = new Date(start.getTime() + 86400000)
      if (!req.body.allowMultiple && await OutfitCalendar.exists({ _id: { $ne: current._id }, user: req.userId, date: { $gte: start, $lt: end } })) {
        return res.status(409).json({ message: 'There is already an outfit planned for this date.' })
      }
      current.date = date
    }
    if (req.body.outfit) current.outfit = req.body.outfit
    if (typeof req.body.worn === 'boolean') current.worn = req.body.worn
    if (req.body.worn === true && !current.worn) {
      const outfit = await Outfit.findOne({ _id: current.outfit, user: req.userId })
      if (outfit) {
        outfit.wornCount += 1
        await outfit.save()
        await ClothingItem.updateMany({ _id: { $in: outfit.items }, user: req.userId }, { $inc: { wearCount: 1 } })
      }
    }
    await current.save()
    res.json(await current.populate({ path: 'outfit', populate: { path: 'items' } }))
  } catch (error) { next(error) }
})
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await OutfitCalendar.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!entry) return res.status(404).json({ message: 'Calendar entry not found.' })
    res.json({ message: 'Planned outfit removed.' })
  } catch (error) { next(error) }
})
export default router
