import mongoose from 'mongoose'

mongoose.set('debug', true) 

const connectMongoDB = (url) => {
  return mongoose.connect(url)
}

export default connectMongoDB