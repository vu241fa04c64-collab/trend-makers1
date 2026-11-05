import mongoose from 'mongoose'

const { Schema, model } = mongoose
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  preferences: { city: { type: String, trim: true }, style: String },
  wardrobeCatalogVersion: { type: Number, default: 0 }
}, { timestamps: true })

const clothingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['Tops', 'Bottoms', 'Dresses', 'Traditional wear', 'Outerwear', 'Footwear', 'Accessories'], required: true },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' },
  catalogId: { type: String, trim: true, index: true },
  color: { type: String, required: true, trim: true },
  brand: { type: String, trim: true, default: '' },
  season: { type: String, enum: ['Summer', 'Winter', 'Monsoon', 'All-season'], default: 'All-season' },
  occasion: { type: String, enum: ['Casual', 'Casual Outing', 'College', 'Office', 'Party', 'Wedding', 'Formal', 'Travel'], default: 'Casual' },
  style: { type: String, enum: ['Minimal', 'Minimalist', 'Casual', 'Elegant', 'Traditional', 'Streetwear', 'Formal', 'Trendy'], default: 'Casual' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  imageUrl: { type: String, default: '' },
  favorite: { type: Boolean, default: false },
  wearCount: { type: Number, default: 0 }
}, { timestamps: true })

const outfitSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  items: [{ type: Schema.Types.ObjectId, ref: 'ClothingItem' }],
  occasion: { type: String, default: 'Casual' },
  style: { type: String, default: 'Casual' },
  notes: { type: String, default: '' },
  favorite: { type: Boolean, default: false },
  wornCount: { type: Number, default: 0 }
}, { timestamps: true })

const calendarSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  outfit: { type: Schema.Types.ObjectId, ref: 'Outfit', required: true },
  date: { type: Date, required: true },
  worn: { type: Boolean, default: false }
}, { timestamps: true })
calendarSchema.index({ user: 1, date: 1 })

export const User = model('User', userSchema)
export const ClothingItem = model('ClothingItem', clothingSchema)
export const Outfit = model('Outfit', outfitSchema)
export const OutfitCalendar = model('OutfitCalendar', calendarSchema)
