const mongoose = require('mongoose')
const validator = require('validator')

const portfolioSchema = mongoose.Schema({
  //name: name of the portfolio as a string
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },

  //owner: owner of the portfolio, given as user id
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  //public: whether the portfolio is readable by any visitor to the site (user or not)
  public: {
    type: Boolean,
    required: false,
    default: true
  },

  //desc: description of the portfolio.
  desc: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 160
  },

  //followers: the number of followers of this portfolio.
  followers: {
    type: Number,
    required: true,
  },

  //buys: an array of all the Buys in the portfolio.
  buys: [{
    buy: {

      //stock: the stock id of this buy.
      stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
      },

      //buyPx: the buy price of this stock.
      buyPx: {
        type: Number,
        required: true
      },

      //count: the number of shares bought. Positive for long pos, neg for short.
      count: {
        type: Number,
        required: true
      }
    }
  }],

  //eyes: an array of all the Eyes, represented as stock ids, in the portfolio
  eyes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  }],

  //notes: an array of all the Note objects in this portfolio.
  notes: [{
    note: {
      //stock: stock id to which the note pertains.
      stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
      },

      //content: content of the note. Max length 160.
      content: {
        type: String,
        required: true,
        maxlength: 160
      }
    }
  }],

  //strategies: an array of all Strategy objects in this portfolio.
  strategies: [{
    strategy: {
      //tag: tag (name) of the strategy. Max length 20.
      tag: {
        type: String,
        required: true,
        maxlength: 20
      },

      //desc: description of the strategy. Max length 400.
      desc: {
        type: String,
        required: true,
        maxlength: 400
      },

      //bullorbear: "bull" if the strategy is a bull strategy, "bear" if a bear strategy.
      bullorbear: {
        type: String,
        required: false
      },

      //stocks: array of stock ids that this strategy is attached to.
      stocks: [{
        stock: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Stock',
          required: true
        }
      }]
    },

    //targets: array of target prices in this portfolio.
    targets: [{
      target: {
        //stock: stock that this target price pertains to.
        stock: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Stock',
          required: true
        },

        //price: target price.
        price: {
          type: Number,
          required: true
        }
      }
    }],

    //overalls: overall numbers of this portfolio.
    overalls: {
      //buyGains: historical array of percent gains/losses of bought stocks, last 365 days.
      buyGains: [Number],

      //eyeGains: historical array of percent gains/losses of eyed stocks, last 365 days.
      eyeGains: [Number],

      //Note that the buyGains and eyeGains track gains and losses as they happen with stocks that were in the portfolio at the time.

      //netValue: historical array of the net liquidating value of the portfolio.
      netValue: [Number],

      //contrHist: array of Contr objects, representing contributions/withdrawals to the account.
      contrHist: [{
        contr: {
          //date: JS date object, the date of the contribution or withdrawal. (Represented in milliseconds)
          date: {
            type: Date,
            default: Date.now(),
            required: true
          },

          //amount: amount of the contribution or withdrawal; positive or negative accordingly.
          amount: {
            type: Number,
            required: true
          }
        }
      }]
    }
  }]
})

portfolioSchema.methods.canRead = function(user) {
  if (this.public) return true;
  return user ? this.owner.toString() === user._id.toString() : false;
}

portfolioSchema.methods.canWrite = function(user) {
  return user ? this.owner.toString() === user._id.toString() : false;
}

const Portfolio = mongoose.model('Portfolio', portfolioSchema)

module.exports = Portfolio;