import { Router } from 'express'
import { ClothingItem, Outfit } from '../models.js'
import requireAuth from '../middleware/auth.js'
import { dedupeWardrobeItems } from '../starter-wardrobe.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try { res.json(await Outfit.find({ user: req.userId }).populate('items').sort({ updatedAt: -1 })) }
  catch (error) { next(error) }
})
router.post('/style', async (req, res, next) => {
  try {
    const { occasion = 'Casual Outing', style = 'Casual', gender, season, selectedIds = [], offset = 0 } = req.body
    if (!Array.isArray(selectedIds) || selectedIds.length > 8) {
      return res.status(400).json({ message: 'Select up to 8 pieces from your wardrobe.' })
    }
    if (!Number.isInteger(offset) || offset < 0 || offset > 1000) {
      return res.status(400).json({ message: 'Request another outfit set to continue styling.' })
    }

    const wardrobeFilter = { user: req.userId }
    wardrobeFilter.imageUrl = { $regex: /^(?:https?:\/\/images\.unsplash\.com\/(?:photo-|premium_photo-)[a-z0-9-]{10,}(?:\?|$)|https?:\/\/(?!images\.unsplash\.com\/)[^/]+\/[^?\s]{6,}|data:image\/[^;]+;base64,)/i }
    if (['Men', 'Women'].includes(gender)) wardrobeFilter.gender = { $in: [gender, 'Unisex'] }
    else if (gender === 'Unisex') wardrobeFilter.gender = 'Unisex'
    const wardrobe = dedupeWardrobeItems(await ClothingItem.find(wardrobeFilter).lean())
    if (!wardrobe.length) return res.status(400).json({ message: 'Your wardrobe is empty.' })

    const ownedById = new Map(wardrobe.map((item) => [String(item._id), item]))
    const uniqueIds = [...new Set(selectedIds.map(String))]
    const selected = uniqueIds.map((id) => ownedById.get(id))
    if (selected.some((item) => !item)) {
      return res.status(400).json({ message: 'Every selected piece must be in your wardrobe collection.' })
    }

    const isKurta = (item) => item.category === 'Traditional wear' && /kurta/i.test(item.name)
    const isOnePiece = (item) =>
      item.category === 'Dresses' ||
      (item.category === 'Traditional wear' && !isKurta(item))
    const selectedCategories = new Set(selected.map((item) => item.category))
    const selectedColors = selected
      .map((item) => item.color)
      .filter((color) => color && color !== 'Other')
    const selectedHasOnePiece = selected.some(isOnePiece)
    const selectedHasTop = selected.some((item) => item.category === 'Tops' || isKurta(item))
    const selectedHasBottom = selectedCategories.has('Bottoms')
    const selectedHasFootwear = selectedCategories.has('Footwear')
    const selectedHasAccessory = selectedCategories.has('Accessories')
    const coreGender = selected.find((item) =>
      item.gender !== 'Unisex' &&
      ['Tops', 'Bottoms', 'Dresses', 'Traditional wear'].includes(item.category)
    )?.gender
    const targetGender = ['Men', 'Women'].includes(gender) ? gender : coreGender
    const unsuitableAccessoryNames = targetGender === 'Men'
      ? new Set(['Earrings', 'Necklace', 'Jewelry', 'Hairband'])
      : targetGender === 'Women'
        ? new Set(['Tie', 'Bow tie', 'Cufflinks', 'Pocket square', 'Suspenders'])
        : new Set()
    const matchingWardrobe = wardrobe.filter((item) =>
      (!targetGender || item.gender === targetGender || item.gender === 'Unisex') &&
      !(item.category === 'Accessories' && unsuitableAccessoryNames.has(item.name))
    )
    const neutrals = new Set(['Black', 'White', 'Beige', 'Brown', 'Grey', 'Navy'])
    const compatibleColors = {
      Black: neutrals,
      White: new Set(['Black', 'White', 'Beige', 'Brown', 'Blue', 'Navy', 'Green', 'Red', 'Pink', 'Grey']),
      Beige: new Set(['Black', 'White', 'Beige', 'Brown', 'Blue', 'Navy', 'Green', 'Pink', 'Grey']),
      Brown: new Set(['Black', 'White', 'Beige', 'Brown', 'Blue', 'Navy', 'Green']),
      Blue: new Set(['Black', 'White', 'Beige', 'Brown', 'Blue', 'Navy', 'Grey']),
      Navy: new Set(['Black', 'White', 'Beige', 'Brown', 'Blue', 'Navy', 'Grey']),
      Green: new Set(['Black', 'White', 'Beige', 'Brown', 'Green', 'Grey']),
      Red: new Set(['Black', 'White', 'Beige', 'Navy', 'Red', 'Grey']),
      Pink: new Set(['Black', 'White', 'Beige', 'Navy', 'Pink', 'Grey']),
      Grey: neutrals
    }
    const relatedOccasions = {
      College: new Set(['Casual Outing']),
      'Casual Outing': new Set(['College', 'Travel']),
      Travel: new Set(['Casual Outing', 'College']),
      Office: new Set(['Formal']),
      Formal: new Set(['Office']),
      Party: new Set(['Wedding']),
      Wedding: new Set(['Party'])
    }
    const relatedStyles = {
      Casual: new Set(['Streetwear', 'Minimalist', 'Minimal']),
      Streetwear: new Set(['Casual']),
      Elegant: new Set(['Formal']),
      Formal: new Set(['Elegant']),
      Minimalist: new Set(['Minimal', 'Casual']),
      Minimal: new Set(['Minimalist', 'Casual'])
    }
    const score = (item) => {
      let value = item.occasion === occasion
        ? 5
        : relatedOccasions[occasion]?.has(item.occasion)
          ? 2
          : -1
      value += item.style === style
        ? 4
        : relatedStyles[style]?.has(item.style)
          ? 1
          : -1
      if (season) {
        value += item.season === season ? 5 : item.season === 'All-season' ? 2 : -4
      }
      if (item.color === 'Other') value -= 2
      else if (!selectedColors.length) value += neutrals.has(item.color) ? 2 : 1
      else if (selectedColors.includes(item.color)) value += 3
      else {
        const compatibleCount = selectedColors.filter((color) =>
          compatibleColors[color]?.has(item.color)
        ).length
        if (compatibleCount === selectedColors.length) value += 4
        else if (compatibleCount) value += compatibleCount
        else if (neutrals.has(item.color)) value += 1
        else value -= 2
      }
      return value
    }
    const outfitNames = ['Balanced everyday look', 'Easygoing color story', 'Polished finish']
    const stylingTip = (pieces) => {
      if (season === 'Winter') {
        const outerwear = pieces.find((item) => item.category === 'Outerwear')
        return outerwear
          ? `Layer with your ${outerwear.name} and choose closed-toe shoes to stay comfortable in the cold.`
          : 'This wardrobe has no pictured warm layer yet; add one you own before heading out in the cold.'
      }
      if (season === 'Monsoon') {
        const outerwear = pieces.find((item) => item.category === 'Outerwear')
        return outerwear
          ? `Keep your ${outerwear.name} handy and choose practical shoes that feel secure on wet streets.`
          : 'This wardrobe has no pictured rain layer yet; keep your own rain protection handy.'
      }
      if (pieces.some(isOnePiece)) {
        return style === 'Formal' || occasion === 'Wedding'
          ? 'Let the one-piece outfit lead; keep accessories understated and choose occasion-ready shoes.'
          : 'Keep the one-piece as the focus and use one simple accessory to finish the look.'
      }
      if (['Formal', 'Elegant'].includes(style) || occasion === 'Office') {
        return 'Keep the lines clean, tuck or tailor the top, and let one polished piece finish the look.'
      }
      if (style === 'Traditional' || occasion === 'Wedding') {
        return 'Keep the traditional silhouette in focus and coordinate accessories with one color in the outfit.'
      }
      if (style === 'Minimalist') {
        return 'Keep the palette quiet, choose clean lines, and let one considered accessory do the talking.'
      }
      return 'Balance the top and bottom, then use footwear or one accessory to bring the colors together.'
    }
    const results = []
    const signatures = new Set()
    const addResult = (pieces, includedSelected) => {
      const finalSignature = pieces.map((item) => String(item._id)).sort().join(':')
      if (signatures.has(finalSignature)) return
      signatures.add(finalSignature)

      const colors = [...new Set(pieces.map((item) => item.color).filter((color) => color && color !== 'Other'))]
      const name = `${outfitNames[results.length]} for ${occasion}`
      const tip = stylingTip(pieces)
      const selectedNames = includedSelected.map((item) => item.name)
      const additions = pieces
        .filter((item) => !includedSelected.some((chosen) => String(chosen._id) === String(item._id)))
        .map((item) => item.name.toLowerCase())
      results.push({
        name,
        occasion,
        style,
        items: pieces,
        selectedItemIds: includedSelected.map((item) => String(item._id)),
        colorCombination: colors.join(' + ') || 'Your selected colors',
        stylingTip: tip,
        explanation: `Keeps your ${selectedNames.join(', ')} at the center${additions.length ? ` with ${additions.join(', ')}` : ''} for ${occasion}${colors.length ? `, using a coordinated ${colors.slice(0, 2).join(' and ')} color story` : ''}.`,
        notes: `${tip} ${colors.length ? `Color story: ${colors.join(' + ')}.` : ''}`
      })
    }

    for (let variation = 0; results.length < 3 && variation < 30; variation += 1) {
      const pieces = [...selected]
      const categoriesToFill = []
      if (!selectedHasOnePiece) {
        if (!selectedHasTop) categoriesToFill.push('Tops')
        if (!selectedHasBottom) categoriesToFill.push('Bottoms')
      }
      if (!selectedHasFootwear) categoriesToFill.push('Footwear')
      if (!selectedHasAccessory) categoriesToFill.push('Accessories')
      if (
        (['Formal', 'Elegant', 'Traditional'].includes(style) || ['Winter', 'Monsoon'].includes(season)) &&
        !selectedCategories.has('Outerwear')
      ) {
        categoriesToFill.push('Outerwear')
      }
      for (const category of categoriesToFill) {
        const options = matchingWardrobe
          .filter((item) => item.category === category)
          .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
        if (!options.length) continue
        const variations = options.slice(0, 5)
        const choice = variations[(offset + variation) % variations.length]
        if (!pieces.some((item) => String(item._id) === String(choice._id))) pieces.push(choice)
      }

      addResult(pieces, selected)
    }

    for (let variation = 0; results.length < 3 && variation < selected.length * 10; variation += 1) {
      const anchor = selected[variation % selected.length]
      const anchorIsOnePiece = isOnePiece(anchor)
      const anchorIsTop = anchor.category === 'Tops' || isKurta(anchor)
      const categoriesToFill = []
      if (!anchorIsOnePiece) {
        if (!anchorIsTop) categoriesToFill.push('Tops')
        if (anchor.category !== 'Bottoms') categoriesToFill.push('Bottoms')
      }
      if (anchor.category !== 'Footwear') categoriesToFill.push('Footwear')
      if (anchor.category !== 'Accessories') categoriesToFill.push('Accessories')
      if (
        (['Formal', 'Elegant', 'Traditional'].includes(style) || ['Winter', 'Monsoon'].includes(season)) &&
        anchor.category !== 'Outerwear'
      ) {
        categoriesToFill.push('Outerwear')
      }

      const pieces = [anchor]
      for (const category of categoriesToFill) {
        const options = matchingWardrobe
          .filter((item) => item.category === category)
          .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
        if (!options.length) continue
        const variationIndex = Math.floor(variation / selected.length)
        const choice = options.slice(0, 5)[(offset + variationIndex) % Math.min(options.length, 5)]
        if (!pieces.some((item) => String(item._id) === String(choice._id))) pieces.push(choice)
      }
      addResult(pieces, [anchor])
    }

    if (results.length < 3) {
      return res.status(400).json({ message: 'Your wardrobe needs a few more different pieces to create three distinct outfits. Try adding a top, bottom, shoes, or accessory.' })
    }
    res.json(results)
  } catch (error) { next(error) }
})
router.post('/recommend', async (req, res, next) => {
  try {
    const { occasion, style, gender, weather, temperature, colors } = req.body
    const wardrobeFilter = { user: req.userId }
    if (['Men', 'Women'].includes(gender)) wardrobeFilter.gender = { $in: [gender, 'Unisex'] }
    else if (gender === 'Unisex') wardrobeFilter.gender = 'Unisex'
    const items = await ClothingItem.find(wardrobeFilter)
    if (!items.length) return res.status(400).json({ message: 'Add a few wardrobe pieces before planning an outfit.' })
    if (process.env.AI_API_KEY && process.env.AI_API_URL) {
      const response = await fetch(process.env.AI_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          temperature: 0.6,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a personal stylist. Return JSON with keys name, itemIds, notes. itemIds must contain only IDs from the provided wardrobe. Create a complete suitable outfit; use 1 to 4 available pieces. Never invent items.' },
            { role: 'user', content: JSON.stringify({ occasion, style, gender, weather, temperature, preferredColors: colors || [], wardrobe: items.map((item) => ({ id: String(item._id), name: item.name, category: item.category, gender: item.gender, color: item.color, season: item.season, occasion: item.occasion, style: item.style })) }) }
          ]
        }),
        signal: AbortSignal.timeout(20000)
      })
      if (!response.ok) return res.status(502).json({ message: 'The outfit recommendation service is unavailable. Try again or remove the AI configuration to use local styling.' })
      const completion = await response.json()
      let suggestion
      try {
        suggestion = JSON.parse(completion.choices?.[0]?.message?.content || '{}')
      } catch {
        return res.status(502).json({ message: 'The outfit recommendation service returned an invalid response.' })
      }
      const ownedById = new Map(items.map((item) => [String(item._id), item]))
      const selected = [...new Set(Array.isArray(suggestion.itemIds) ? suggestion.itemIds : [])]
        .map((id) => ownedById.get(String(id)))
        .filter(Boolean)
        .slice(0, 4)
      if (!selected.length) return res.status(502).json({ message: 'The outfit recommendation service did not select any of your wardrobe pieces.' })
      return res.json({
        name: typeof suggestion.name === 'string' ? suggestion.name.slice(0, 100) : `${style || 'Everyday'} ${occasion || 'Casual'} look`,
        items: selected,
        occasion: occasion || 'Casual',
        style: style || 'Casual',
        notes: typeof suggestion.notes === 'string' ? suggestion.notes.slice(0, 300) : 'Curated from your wardrobe'
      })
    }
    const preferredColors = (colors || []).map((color) => color.toLowerCase())
    const cold = weather === 'Cold' || Number(temperature) < 14
    const hot = weather === 'Hot' || Number(temperature) > 27
    const rainy = weather === 'Rainy'
    const score = (item) => {
      let value = 0
      if (item.occasion === occasion) value += 4
      if (item.style === style) value += 3
      if (preferredColors.includes(item.color.toLowerCase())) value += 3
      if (item.season === 'All-season' || (cold && item.season === 'Winter') || (hot && item.season === 'Summer') || (rainy && item.season === 'Monsoon')) value += 2
      if (cold && item.category === 'Outerwear') value += 6
      if (hot && item.category === 'Tops') value += 2
      return value
    }
    const bucket = (category) => items.filter((item) => item.category === category).sort((a, b) => score(b) - score(a))
    let selected = []
    if (bucket('Dresses').length) selected = [bucket('Dresses')[0]]
    else {
      selected = [bucket('Tops')[0], bucket('Bottoms')[0]].filter(Boolean)
    }
    const optional = cold || rainy ? ['Outerwear'] : []
    for (const category of optional) {
      if (bucket(category).length && !selected.some((item) => item.category === category)) selected.push(bucket(category)[0])
    }
    if (!selected.length) selected = [...items].sort((a, b) => score(b) - score(a)).slice(0, 3)
    const total = [...selected].sort((a, b) => score(b) - score(a))
    res.json({
      name: `${style || 'Everyday'} ${occasion || 'Casual'} look`,
      items: total,
      occasion: occasion || 'Casual',
      style: style || 'Casual',
      notes: `${weather || 'Mild'} weather · Curated from your wardrobe`
    })
  } catch (error) { next(error) }
})
router.post('/', async (req, res, next) => {
  try {
    const ids = [...new Set(req.body.items || [])]
    const owned = await ClothingItem.find({ _id: { $in: ids }, user: req.userId }).select('_id')
    if (owned.length !== ids.length || !ids.length) return res.status(400).json({ message: 'Choose clothing items from your wardrobe.' })
    const outfit = await Outfit.create({ ...req.body, items: ids, user: req.userId })
    res.status(201).json(await outfit.populate('items'))
  } catch (error) { next(error) }
})
router.put('/:id', async (req, res, next) => {
  try {
    const data = {}
    for (const key of ['name', 'occasion', 'style', 'notes', 'favorite']) {
      if (Object.hasOwn(req.body, key)) data[key] = req.body[key]
    }
    if (Object.hasOwn(req.body, 'items')) {
      const ids = [...new Set(req.body.items || [])]
      const owned = await ClothingItem.find({ _id: { $in: ids }, user: req.userId }).select('_id')
      if (owned.length !== ids.length) return res.status(400).json({ message: 'All outfit pieces must belong to your wardrobe.' })
      data.items = ids
    }
    const outfit = await Outfit.findOneAndUpdate({ _id: req.params.id, user: req.userId }, data, { new: true, runValidators: true }).populate('items')
    if (!outfit) return res.status(404).json({ message: 'Outfit not found.' })
    res.json(outfit)
  } catch (error) { next(error) }
})
router.delete('/:id', async (req, res, next) => {
  try {
    const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, user: req.userId })
    if (!outfit) return res.status(404).json({ message: 'Outfit not found.' })
    res.json({ message: 'Outfit deleted.' })
  } catch (error) { next(error) }
})
export default router
