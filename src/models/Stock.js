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
  targetAvg: {
    avg: Number,
    sum: Number,
    count: Number
  },

  //buys: historical array of long pos minus short pos (counts). (0th element is today)
  buys: {
    type: [Number],
  },

  //res: information about the number of res about the stock.
  res: {
    //lastDay: hourly historical array of the number of res in the last day.
    lastDay: [Number]
  },

  //eyes: information about the number of portfolios that have this stock in eyes.
  eyes: {
    type: [Number]
  }
})

stockSchema.methods.addTarget(val) {
  this.targetAvg.sum += val;
  this.targetAvg.count++;
  this.avg = this.targetAvg.sum / this.targetAvg.count;
}

stockSchema.methods.removeTarget(val) {
  this.targetAvg.sum -= val;
  this.targetAvg.count--;
  this.avg = this.targetAvg.sum / this.targetAvg.count;
}

const Stock = mongoose.model('Stock', stockSchema)

module.exports = Stock;