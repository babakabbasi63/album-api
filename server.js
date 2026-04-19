import app from './app.js'
import connectMongoDB from './db/mongodb.js'
import { MONGO_URI, PORT } from './utils/config.js'

try {
  await connectMongoDB(MONGO_URI)
  console.log('Connected to MongoDB!')
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
} catch (error) {
  console.log('Failed to connect to MongoDB:', error)
}