import { Router } from 'express'
import { ClothingItem, Outfit, User } from '../models.js'
import requireAuth from '../middleware/auth.js'
import { dedupeWardrobeItems, legacyStarterWardrobe, starterWardrobe, starterWardrobeCandidates } from '../starter-wardrobe.js'

const router = Router()
router.use(requireAuth)

const filters = (query) => {
  const result = { user: query.userId }
  for (const key of ['category', 'gender', 'color', 'season', 'occasion']) {
    if (query[key] && query[key] !== 'All') result[key] = new RegExp(`^${query[key]}$`, 'i')
  }
  if (query.search) result.name = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  if (query.favorite === 'true') result.favorite = true
  return result
}

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const catalogIdFor = (item) => {
  const photoId = item.imageUrl.match(/\/(photo-[^?]+)/)?.[1] || item.category
  return `${item.gender.toLowerCase()}-${slug(item.name)}-${slug(photoId)}`
}
const catalogById = new Map(starterWardrobe.map((item) => [catalogIdFor(item), item]))
const starterItemNames = new Set(starterWardrobeCandidates.map((item) => item.name.toLowerCase()))
const starterByName = new Map(starterWardrobe.map((item) => [item.name.toLowerCase(), item]))
const legacyStarterByName = new Map(legacyStarterWardrobe.map((item) => [item.name.toLowerCase(), item]))

const isUntouchedStarterItem = (item) => {
  const name = item.name.trim().toLowerCase()
  const starter = starterByName.get(name)
  const legacyStarter = legacyStarterByName.get(name)
  return starterItemNames.has(name) &&
    (!item.category || item.category === starter?.category || item.category === legacyStarter?.category) &&
    (!item.gender || item.gender === starter?.gender || item.gender === legacyStarter?.gender || item.gender === 'Unisex') &&
    (item.color === 'Other' || item.color === starter?.color || item.color === legacyStarter?.color) &&
    (!item.brand && !item.notes && !item.favorite && item.wearCount === 0) &&
    (item.season === 'All-season' || item.season === starter?.season || item.season === legacyStarter?.season) &&
    (item.occasion === 'Casual' || item.occasion === starter?.occasion || item.occasion === legacyStarter?.occasion) &&
    (item.style === 'Casual' || item.style === starter?.style || item.style === legacyStarter?.style) &&
    (!item.imageUrl || item.imageUrl.startsWith('https://images.unsplash.com/'))
}

router.get('/catalog', (_req, res) => {
  res.json(starterWardrobe.map((item) => ({ ...item, catalogId: catalogIdFor(item) })))
})

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.userId, $or: [{ wardrobeCatalogVersion: { $lt: 11 } }, { wardrobeCatalogVersion: { $exists: false } }] },
      { $set: { wardrobeCatalogVersion: 11 } },
      { new: false }
    )
    if (user) {
      try {
        const [existingItems, referencedItemIds] = await Promise.all([
          ClothingItem.find({ user: req.userId }).select('name category gender color brand season occasion style notes favorite wearCount imageUrl').lean(),
          Outfit.distinct('items', { user: req.userId })
        ])
        const referenced = new Set(referencedItemIds.map(String))
        const unclaimedIds = existingItems
          .filter((item) => isUntouchedStarterItem(item) && !referenced.has(String(item._id)))
          .map((item) => item._id)
        if (unclaimedIds.length) {
          await ClothingItem.deleteMany({ _id: { $in: unclaimedIds }, user: req.userId })
        }
      } catch (error) {
        await User.updateOne({ _id: req.userId }, { $set: { wardrobeCatalogVersion: 10 } })
        throw error
      }
    }

    const wardrobe = await ClothingItem.find(filters({ ...req.query, userId: req.userId })).lean().sort({ createdAt: -1 })
    res.json(dedupeWardrobeItems(wardrobe))
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { catalogId } = req.body
    let data
    if (catalogId) {
      const catalogItem = catalogById.get(catalogId)
      if (!catalogItem) return res.status(400).json({ message: 'Choose a clothing item from the catalog.' })
      if (await ClothingItem.exists({ user: req.userId, catalogId }) || await ClothingItem.exists({
        user: req.userId,
        name: catalogItem.name,
        category: catalogItem.category,
        gender: catalogItem.gender,
        imageUrl: catalogItem.imageUrl
      })) {
        return res.status(409).json({ message: 'That piece is already in your wardrobe.' })
      }
      data = { ...catalogItem, catalogId }
    } else {
      const allowedFields = ['name', 'category', 'gender', 'color', 'brand', 'season', 'occasion', 'style', 'notes', 'imageUrl', 'favorite']
      data = Object.fromEntries(allowedFields.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]))
      if (!data.name?.trim() || !data.category || !data.color) {
        return res.status(400).json({ message: 'Add a name, category, and color for this clothing item.' })
      }
      data.name = data.name.trim()
    }

    const item = await ClothingItem.create({ ...data, user: req.userId })
    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const item = await ClothingItem.findOne({ _id: req.params.id, user: req.userId })
    if (!item) return res.status(404).json({ message: 'Wardrobe item not found.' })
    res.json(item)
  } catch (error) {
    next(error)
  }
})

export default router
