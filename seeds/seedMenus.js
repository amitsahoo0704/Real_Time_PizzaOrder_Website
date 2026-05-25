require('dotenv').config()
const mongoose = require('mongoose')
const Menu = require('../app/models/menu')
const fs = require('fs')
const path = require('path')

const uri = process.env.MONGO_CONNECTION_URL || 'mongodb://127.0.0.1:27017/pizza'

async function run() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('Connected to MongoDB for seeding')

    const file = path.join(__dirname, '..', 'menus.json')
    const raw = fs.readFileSync(file, 'utf8')
    const items = JSON.parse(raw).map(i => ({
      name: i.name,
      image: i.image,
      price: Number(i.price),
      size: i.size
    }))

    for (const item of items) {
      const res = await Menu.updateOne({ name: item.name, size: item.size }, { $set: item }, { upsert: true })
      if (res.upsertedId) console.log(`Inserted: ${item.name}`)
      else console.log(`Updated/Exists: ${item.name}`)
    }

    console.log('Seeding complete')
  } catch (err) {
    console.error('Seeding error:', err)
  } finally {
    await mongoose.disconnect()
  }
}

run()
