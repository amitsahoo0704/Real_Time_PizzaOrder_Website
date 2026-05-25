const { MongoClient, ServerApiVersion } = require('mongodb')
require('dotenv').config()

const uri = process.env.MONGO_CONNECTION_URL || 'mongodb+srv://sahooamit8348:amitsahoo0704@cluster0.6jdsm.mongodb.net/myDatabase?retryWrites=true&w=majority'

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Increase connection timeout for slow networks
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
})

async function run() {
  try {
    console.log('Attempting to connect to MongoDB...')
    await client.connect()
    console.log('Connected, sending ping...')
    const res = await client.db('admin').command({ ping: 1 })
    console.log('Ping response:', res)
    console.log('Pinged your deployment. Connected to MongoDB!')
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err)
  } finally {
    try { await client.close() } catch (e) { }
  }
}

run().catch((e) => console.error('Unhandled error:', e))
