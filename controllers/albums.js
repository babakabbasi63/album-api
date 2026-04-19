import Album from '../models/Album.js'

const getAlbums = async (req, res) => {
  try {
    // TASK 1: Sorting
    const sort = req.query.sort || 'title'

    // TASK 2: Numeric filtering
    let queryObj = {}

    if (req.query.numericFilters) {
      const operatorMap = {
        '>':  '$gt',
        '>=': '$gte',
        '<':  '$lt',
        '<=': '$lte',
        '=':  '$eq'
      }

      const filters = req.query.numericFilters
        .replace(/\b(>=|<=|>|<|=)\b/g, (match) => `-${operatorMap[match]}-`)

      const allowedFields = ['year', 'trackCount']

      filters.split(',').forEach(item => {
        const [field, operator, value] = item.split('-')
        if (allowedFields.includes(field)) {
          queryObj[field] = queryObj[field] || {}
          queryObj[field][operator] = Number(value)
        }
      })
    }

    // TASK 3: Field selection
    const fields = req.query.fields
      ? req.query.fields.split(',').join(' ')
      : ''

    // TASK 4: Search with regex
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i')
      queryObj.$or = [
        { artist: regex },
        { title: regex }
      ]
    }

    // TASK 5: Custom filtering - year range
    if (req.query.startYear || req.query.endYear) {
      queryObj.year = queryObj.year || {}
      if (req.query.startYear) queryObj.year.$gte = Number(req.query.startYear)
      if (req.query.endYear)   queryObj.year.$lte = Number(req.query.endYear)
    }

    const albums = await Album.find(queryObj)
      .sort(sort)
      .select(fields)
      .exec()

    res.status(200).json({ albums })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

const getAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).exec()
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' })
    }
    res.status(200).json({ album })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

const createAlbum = async (req, res) => {
  try {
    const album = await Album.create(req.body)
    res.status(201).json({ album })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

const updateAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).exec()
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' })
    }
    res.status(200).json({ album })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id).exec()
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' })
    }
    res.status(200).json({ msg: 'Album deleted', album })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

const getAlbumsByGenre = async (req, res) => {
  try {
    const albums = await Album.findByGenre(req.params.genre)
    res.status(200).json({ albums })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

export { getAlbums, getAlbum, createAlbum, updateAlbum, deleteAlbum, getAlbumsByGenre }