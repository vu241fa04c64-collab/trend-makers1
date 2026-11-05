const photo = (imageId, width = 640) =>
  `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=${width}&q=70`

const tops = [
  ['T-shirt', 'photo-1521572163474-6864f9cf17ab'],
  ['Polo shirt', 'photo-1603252109303-2751441dd157'],
  ['Casual shirt', 'photo-1521572163474-6864f9cf17ab'],
  ['Formal shirt', 'photo-1603252109303-2751441dd157'],
  ['Linen shirt', 'photo-1602810318383-e386cc2a3ccf'],
  ['Blouse', 'photo-1496747611176-843222e1e57c'],
  ['Tank top', 'photo-1503342217505-b0a15ec3261c'],
  ['Sweater', 'photo-1576566588028-4147f3842f27'],
  ['Hoodie', 'photo-1556821840-3a63f95609a7'],
  ['Cardigan', 'photo-1434389677669-e08b4cac3105'],
  ['Kurta', 'photo-1610030469983-98e550d6193c'],
  ['Crop top', 'photo-1551163943-3f6a855d1153']
]

const bottoms = [
  ['Jeans', 'photo-1542272604-787c3835535d'],
  ['Trousers', 'photo-1473966968600-fa801b869a1a'],
  ['Chinos', 'photo-1624378439575-d8705ad7ae80'],
  ['Leggings', 'photo-1542272604-787c3835535d'],
  ['Shorts', 'photo-1591195853828-11db59a44f6b'],
  ['Skirt', 'photo-1583496661160-fb5886a0aaaa'],
  ['Joggers', 'photo-1552902865-b72c031ac5ea'],
  ['Palazzo pants', 'photo-1509631179647-0177331693ae']
]

const dresses = [
  ['Casual dress', 'photo-1496747611176-843222e1e57c'],
  ['Maxi dress', 'photo-1515886657613-9f3515b0c78f'],
  ['Midi dress', 'photo-1539008835657-9e8e9680c956'],
  ['Jumpsuit', 'photo-1544441893-675973e31985'],
  ['Saree', 'photo-1617627143750-d86bc21e42bb'],
  ['Anarkali suit', 'photo-1596783074918-c84cb06531ca'],
  ['Salwar suit', 'photo-1597983073750-16f5ded1321f']
]

const outerwear = [
  ['Denim jacket', 'photo-1543076447-215ad9ba6923'],
  ['Blazer', 'photo-1591047139829-d91aecb6caea'],
  ['Coat', 'photo-1539533018447-63fcce2678e3'],
  ['Raincoat', 'photo-1544923246-77307dd654cb'],
  ['Puffer jacket', 'photo-1544923246-77307dd654cb'],
  ['Leather jacket', 'photo-1591047139829-d91aecb6caea'],
  ['Shawl', 'photo-1601924994987-69e26d50dc26']
]

const footwear = [
  ['Sneakers', 'photo-1542291026-7eec264c27ff'],
  ['Formal shoes', 'photo-1614252235316-8c857d38b5f4'],
  ['Boots', 'photo-1608256246200-53e635b5b65f'],
  ['Sandals', 'photo-1603487742131-4160ec999306'],
  ['Heels', 'photo-1543163521-1bf539c55dd2'],
  ['Flats', 'photo-1543163521-1bf539c55dd2'],
  ['Loafers', 'photo-1531310197839-ccf54634509e']
]

const accessories = [
  ['Backpack', 'photo-1553062407-98eeb64c6a62'],
  ['Handbag', 'photo-1584917865442-de89df76afd3'],
  ['Shoulder bag', 'photo-1590874103328-eac38a683ce7'],
  ['Crossbody bag', 'photo-1548036328-c9fa89d128fa'],
  ['Tote bag', 'photo-1548036328-c9fa89d128fa'],
  ['Clutch bag', 'photo-1584917865442-de89df76afd3'],
  ['Wallet', 'photo-1584917865442-de89df76afd3'],
  ['Belt', 'photo-1589756823695-278bc923f962'],
  ['Suspenders', 'photo-1589756823695-278bc923f962'],
  ['Scarf', 'photo-1601924994987-69e26d50dc26'],
  ['Silk scarf', 'photo-1601924994987-69e26d50dc26'],
  ['Winter scarf', 'photo-1601924994987-69e26d50dc26'],
  ['Watch', 'photo-1523275335684-37898b6baf30'],
  ['Bracelet watch', 'photo-1523170335258-f5ed11844a49'],
  ['Sunglasses', 'photo-1511499767150-a48a237f0083'],
  ['Reading glasses', 'photo-1511499767150-a48a237f0083'],
  ['Hat', 'photo-1521369909029-2afed882baee'],
  ['Baseball cap', 'photo-1521369909029-2afed882baee'],
  ['Beanie', 'photo-1521369909029-2afed882baee'],
  ['Bucket hat', 'photo-1588850561407-ed78c282e89b'],
  ['Jewelry', 'photo-1617038220319-276d3cfab638'],
  ['Necklace', 'photo-1599643478518-a784e5dc4c8f'],
  ['Earrings', 'photo-1611652022419-a9419f74343d'],
  ['Rings', 'photo-1573408301185-9146fe634ad0'],
  ['Bracelet', 'photo-1611591437281-460bfbe1220a'],
  ['Hairband', 'photo-1529139574466-a303027c1d8b'],
  ['Hair clips', 'photo-1529139574466-a303027c1d8b'],
  ['Scrunchie', 'photo-1529139574466-a303027c1d8b'],
  ['Tie', 'photo-1589756823695-278bc923f962'],
  ['Bow tie', 'photo-1589756823695-278bc923f962'],
  ['Cufflinks', 'photo-1617038220319-276d3cfab638'],
  ['Pocket square', 'photo-1601924994987-69e26d50dc26'],
  ['Gloves', 'photo-1601924994987-69e26d50dc26'],
  ['Socks', 'photo-1542272604-787c3835535d'],
  ['Umbrella', 'photo-1544923246-77307dd654cb']
]

const collections = [
  { gender: 'Men', groups: [['Tops', tops.slice(0, 5).concat(tops.slice(6, 8), [tops[8], tops[10]])], ['Bottoms', bottoms.filter(([name]) => !['Skirt', 'Palazzo pants', 'Leggings'].includes(name))], ['Outerwear', outerwear.filter(([name]) => name !== 'Shawl')], ['Footwear', footwear.filter(([name]) => !['Heels', 'Flats'].includes(name))]] },
  { gender: 'Women', groups: [['Tops', tops.filter(([name]) => !['Polo shirt', 'Formal shirt'].includes(name))], ['Bottoms', bottoms.filter(([name]) => name !== 'Chinos')], ['Dresses', dresses], ['Outerwear', outerwear.filter(([name]) => name !== 'Leather jacket')], ['Footwear', footwear.filter(([name]) => !['Formal shoes', 'Loafers'].includes(name))]] },
  { gender: 'Unisex', groups: [['Tops', [tops[0], tops[7], tops[8]]], ['Bottoms', [bottoms[0], bottoms[5], bottoms[6]]], ['Outerwear', [outerwear[0], outerwear[4]]], ['Footwear', [footwear[0], footwear[2], footwear[3]]], ['Accessories', accessories]] }
]

export const starterWardrobeCandidates = collections.flatMap(({ gender, groups }) =>
  groups.flatMap(([category, items]) =>
    items.map(([name, imageId]) => ({
      name,
      category: ['Kurta', 'Saree', 'Anarkali suit', 'Salwar suit'].includes(name) ? 'Traditional wear' : category,
      gender,
      color: 'Other',
      season: 'All-season',
      occasion: 'Casual',
      style: 'Casual',
      imageUrl: photo(imageId)
    }))
  )
)

const seenNames = new Set()
const seenPhotos = new Set()
const uniqueStarterCandidates = starterWardrobeCandidates.filter((item) => {
  const name = item.name.trim().toLowerCase()
  if (seenNames.has(name) || seenPhotos.has(item.imageUrl)) return false
  seenNames.add(name)
  seenPhotos.add(item.imageUrl)
  return true
})

const legacyStarterMetadata = (item, index) => ({
  ...item,
  color: ['Black', 'White', 'Blue', 'Beige', 'Green', 'Red', 'Navy', 'Pink', 'Grey', 'Brown'][index % 10],
  style: item.category === 'Traditional wear'
    ? 'Traditional'
    : /formal|blazer|trousers/i.test(item.name)
      ? 'Formal'
      : ['Casual', 'Trendy', 'Formal', 'Traditional'][index % 4],
  occasion: ['College', 'Casual Outing', 'Office', 'Party', 'Wedding'][index % 5]
})

export const legacyStarterWardrobe = uniqueStarterCandidates.map(legacyStarterMetadata)

const starterDetails = {
  'T-shirt': { color: 'White', style: 'Casual', occasion: 'College', season: 'Summer' },
  'Polo shirt': { color: 'Navy', style: 'Casual', occasion: 'College', season: 'Summer' },
  'Linen shirt': { color: 'Beige', style: 'Formal', occasion: 'Office', season: 'Summer' },
  'Tank top': { color: 'Black', style: 'Casual', occasion: 'Casual Outing', season: 'Summer' },
  Sweater: { color: 'Grey', style: 'Casual', occasion: 'Casual Outing', season: 'Winter' },
  Hoodie: { color: 'Grey', style: 'Streetwear', occasion: 'College', season: 'Winter' },
  Kurta: { color: 'Beige', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  Jeans: { color: 'Blue', style: 'Casual', occasion: 'College', season: 'All-season' },
  Trousers: { color: 'Black', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Chinos: { color: 'Beige', style: 'Casual', occasion: 'Office', season: 'All-season' },
  Shorts: { color: 'Brown', style: 'Casual', occasion: 'Casual Outing', season: 'Summer' },
  Joggers: { color: 'Grey', style: 'Streetwear', occasion: 'College', season: 'All-season' },
  'Denim jacket': { color: 'Blue', style: 'Casual', occasion: 'Casual Outing', season: 'Winter' },
  Blazer: { color: 'Navy', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Coat: { color: 'Brown', style: 'Formal', occasion: 'Office', season: 'Winter' },
  Raincoat: { color: 'Other', style: 'Casual', occasion: 'Casual Outing', season: 'Monsoon' },
  Sneakers: { color: 'White', style: 'Casual', occasion: 'College', season: 'All-season' },
  'Formal shoes': { color: 'Black', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Boots: { color: 'Brown', style: 'Casual', occasion: 'Casual Outing', season: 'Winter' },
  Sandals: { color: 'Brown', style: 'Casual', occasion: 'Casual Outing', season: 'Summer' },
  Loafers: { color: 'Brown', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Blouse: { color: 'White', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Cardigan: { color: 'Beige', style: 'Casual', occasion: 'College', season: 'Winter' },
  'Crop top': { color: 'Black', style: 'Trendy', occasion: 'Party', season: 'Summer' },
  Skirt: { color: 'Black', style: 'Trendy', occasion: 'Party', season: 'All-season' },
  'Palazzo pants': { color: 'Beige', style: 'Casual', occasion: 'Casual Outing', season: 'Summer' },
  'Maxi dress': { color: 'Navy', style: 'Trendy', occasion: 'Party', season: 'Summer' },
  'Midi dress': { color: 'Black', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Jumpsuit: { color: 'Black', style: 'Trendy', occasion: 'Party', season: 'All-season' },
  Saree: { color: 'Red', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  'Anarkali suit': { color: 'Red', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  'Salwar suit': { color: 'Blue', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  Shawl: { color: 'Beige', style: 'Traditional', occasion: 'Wedding', season: 'Winter' },
  Heels: { color: 'Black', style: 'Formal', occasion: 'Party', season: 'All-season' },
  Backpack: { color: 'Green', style: 'Casual', occasion: 'College', season: 'All-season' },
  Handbag: { color: 'Brown', style: 'Formal', occasion: 'Office', season: 'All-season' },
  'Shoulder bag': { color: 'Black', style: 'Casual', occasion: 'Casual Outing', season: 'All-season' },
  'Crossbody bag': { color: 'Black', style: 'Casual', occasion: 'Casual Outing', season: 'All-season' },
  Belt: { color: 'Brown', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Watch: { color: 'Black', style: 'Formal', occasion: 'Office', season: 'All-season' },
  'Bracelet watch': { color: 'Grey', style: 'Formal', occasion: 'Office', season: 'All-season' },
  Sunglasses: { color: 'Black', style: 'Casual', occasion: 'Casual Outing', season: 'Summer' },
  Hat: { color: 'Beige', style: 'Casual', occasion: 'Casual Outing', season: 'Summer' },
  'Bucket hat': { color: 'Beige', style: 'Trendy', occasion: 'Casual Outing', season: 'Summer' },
  Jewelry: { color: 'Beige', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  Necklace: { color: 'Beige', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  Earrings: { color: 'Beige', style: 'Traditional', occasion: 'Wedding', season: 'All-season' },
  Rings: { color: 'Grey', style: 'Formal', occasion: 'Party', season: 'All-season' },
  Bracelet: { color: 'Beige', style: 'Trendy', occasion: 'Party', season: 'All-season' },
  Hairband: { color: 'Black', style: 'Casual', occasion: 'College', season: 'All-season' }
}

export const starterWardrobe = uniqueStarterCandidates.map((item) => ({
  ...item,
  ...starterDetails[item.name]
}))

const starterByName = new Map(starterWardrobe.map((item) => [item.name.toLowerCase(), item]))
const itemPriority = (item) => {
  const starter = starterByName.get(String(item.name).trim().toLowerCase())
  const personalData = Boolean(item.brand || item.notes || item.favorite || item.wearCount > 0)
  if (!starter) return personalData ? 100 : 0
  const metadataMatches = ['category', 'color', 'season', 'occasion', 'style', 'imageUrl']
    .filter((field) => item[field] === starter[field]).length
  return (personalData ? 100 : 0) + metadataMatches
}

export const dedupeWardrobeItems = (items) => {
  const positions = new Map()
  const uniqueItems = []
  for (const item of items) {
    const name = String(item.name).trim().toLowerCase()
    const imageUrl = String(item.imageUrl || '')
    const key = imageUrl ? `${name}:${imageUrl}` : `id:${String(item._id)}`
    const existingIndex = positions.get(key)
    if (existingIndex === undefined) {
      positions.set(key, uniqueItems.length)
      uniqueItems.push(item)
    } else if (itemPriority(item) > itemPriority(uniqueItems[existingIndex])) {
      uniqueItems[existingIndex] = item
    }
  }
  return uniqueItems
}
