const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = mongoose.Schema({
  //name: unique username of user. Max length 15.
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15,
    unique: true
  },

  //email: unique email of user.
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: value => {
      if (!validator.isEmail(value)) {
        throw new Error({error: 'Invalid Email address'})
      }
    }
  },

  //password: password of user, encrypted by bcrypt.
  password: {
    type: String,
    required: true,
    minLength: 7
  },

  //tokens: array of active authentication tokens.
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],

  //portfolios: array of portfolio ids owned by the user.
  portfolios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  }],

  //following: array of portfolio ids followed by the user.
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  }],

  //bio: string bio of the user. Max length 400.
  bio: {
    type: String,
    maxLength: 400
  },

  //rebuys: array of re: ids that the user has bought (i.e. liked).
  rebuys: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Re'
  }],

  //feedSettings: settings regarding what to display in feed.
  feedSettings: [{
    //buyStocks: show re:s about stocks bought in one of the user's portfolios.
    buyStocks: {
      type: Boolean,
      default: true
    },

    //eyeStocks: show re:s about stocks eyed in one of the user's portfolios
    eyeStocks: Boolean,

    //ownPortfolio: show re:s about a portfolio the user owns.
    ownPortfolio: {
      type: Boolean,
      default: true
    },

    //followedPortfolio: show re:s about a portfolio the user follows.
    followedPortfolio: Boolean,

    //ownPosts: show re:s about the user's own re:s (posts).
    ownPosts: {
      type: Boolean,
      default: true
    },

    //boughtPosts: show re:s about posts the user has bought.
    boughtPosts: Boolean
  }]
})

userSchema.pre('save', async function (next) {
  // Hash the password before saving the user model
  const user = this
  if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 8)
  }
  next()
})

userSchema.methods.generateAuthToken = async function() {
  // Generate an auth token for the user
  const user = this
  const token = jwt.sign({_id: user._id}, process.env.JWT_KEY)
  user.tokens = user.tokens.concat({token})
  await user.save()
  return token
}

userSchema.statics.findByCredentials = async (email, password) => {
  // Search for a user by email and password.
  const user = await User.findOne({ email} )
  if (!user) {
      throw new Error({ error: 'Invalid login credentials' })
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password)
  if (!isPasswordMatch) {
      throw new Error({ error: 'Invalid login credentials' })
  }
  return user
}

const User = mongoose.model('User', userSchema)

module.exports = User