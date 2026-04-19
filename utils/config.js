import 'dotenv/config'

// use test database when running tests
const MONGO_URI = process.env.RUNTIME_ENV === 'test'
  ? process.env.TEST_MONGO_URI
  : process.env.MONGO_URI

const PORT = process.env.PORT || 3000

export { MONGO_URI, PORT }