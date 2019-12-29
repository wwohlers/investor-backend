const mongoose = require('mongoose')
const validator = require('validator')

const stockSchema = mongoose.Schema({
  //ticker: ticker of the stock.
  ticker: {
    type: String,
    required: true
  },

  //name: full name of the stock.
  name: {
    type: String,
    required: true
  },

  //industry: industry of the stock.
  industry: {
    type: String,
    required: true
  },
  
  //targetAvg: portfolio target price average. Null means no target prices.
  targetAvg: Number,

  //buys: information about how many buys the stock has.
  buys: {
    //net: historical array of the difference in pos. counts, i.e. + positions minus negative positions.
    net: [Number],

    //noBuys: historical array of the number of portfolios that have this stock in buys.
    noBuys: [Number]
  },

  //res: information about the number of res about the stock.
  res: {
    //lastDay: hourly historical array of the number of res in the last day.
    lastDay: [Number]
  },

  //eyes: information about the number of portfolios that have this stock in eyes.
  eyes: {
    //noEyes: historical array of the number of portfolios with this stock in eyes.
    noEyes: [Number]
  }
})

const Stock = mongoose.model('Stock', stockSchema)

module.exports = Stock;