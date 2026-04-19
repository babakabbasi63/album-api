import { Schema, model } from 'mongoose'

const albumSchema = new Schema({

  // ─── TASK 2: Basic field validation ───────────────────────────────────────

  artist: {
    type: String,
    required: [true, 'Artist name is required'],
    minlength: [3, 'Artist name must be at least 3 characters'],
    maxlength: [50, 'Artist name cannot exceed 50 characters'],
    trim: true   // removes accidental leading/trailing spaces
  },

  title: {
    type: String,
    required: [true, 'Album title is required'],
    minlength: [3, 'Album title must be at least 3 characters'],
    maxlength: [50, 'Album title cannot exceed 50 characters'],
    trim: true
  },

  trackCount: {
    type: Number,
    min: [1, 'Track count must be greater than 0'],
    max: [100, 'Track count cannot exceed 100']
  },

  year: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1900, 'Release year must be 1900 or later'],
    max: [new Date().getFullYear(), `Release year cannot exceed ${new Date().getFullYear()}`]
  },

  genre: {
    type: String,
    enum: {
      values: ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic', 'Country', 'Metal', 'Blues', 'Other'],
      message: '{VALUE} is not a valid genre'
    }
  },

  // ─── TASK 5: Async duplicate validation ───────────────────────────────────
  // I store artist+title combined so I can check for duplicates easily

  artistTitle: {
    type: String,
    validate: {
      validator: async function(value) {
        // 'this' refers to the current document being saved
        // this._id is the current document's id
        const album = await this.constructor.findOne({
          artistTitle: value,
          _id: { $ne: this._id }  // $ne means "not equal" — exclude current doc
        })
        // if no album found with same artistTitle, validation passes
        return !album
      },
      message: 'An album with this artist and title already exists'
    }
  }

})

// ─── TASK 3: Custom validator — year cannot be in the future ────────────────
// This is a path-level custom validator added separately for clarity

albumSchema.path('year').validate(function(value) {
  return value <= new Date().getFullYear()
}, 'Release year cannot be in the future')

// ─── TASK 4: Virtual property ────────────────────────────────────────────────
// Virtuals are not stored in the database, they are calculated on the fly
// ageInYears calculates how old the album is based on the year field

albumSchema.virtual('ageInYears').get(function() {
  return new Date().getFullYear() - this.year
})

// ─── TASK 4: Instance method ─────────────────────────────────────────────────
// Instance methods are called on a single album document


albumSchema.methods.isClassic = function() {
  return this.ageInYears > 25
}

// ─── TASK 4: Static method ───────────────────────────────────────────────────
// Static methods are called on the Model itself, not on a document

albumSchema.statics.findByGenre = function(genre) {
  return this.find({ genre: genre })
}

// ─── Pre-save hook: set artistTitle before saving ────────────────────────────
// This runs automatically before every .save() or .create()
// I combine artist + title so the async validator above can check for duplicates

albumSchema.pre('save', function() {
  const artist = this.artist || ''
  const title = this.title || ''
  this.artistTitle = (artist + '-' + title).toLowerCase()
})

export default model('Album', albumSchema)