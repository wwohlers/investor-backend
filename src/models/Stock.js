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
    avg: {
      type: Number,
      default: 0
    },
    sum: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },

  //buys: historical array of long pos minus short pos (counts). (0th element is today)
  buys: {
    type: [Number],
  },

  //eyes: information about the number of portfolios that have this stock in eyes.
  eyes: {
    type: [Number],
    default: [0],
  }
})

stockSchema.methods.addTarget = async function(val) {
  this.targetAvg.sum += val;
  this.targetAvg.count++;
  this.targetAvg.avg = this.targetAvg.sum / Math.max(1, this.targetAvg.count);
}

stockSchema.methods.removeTarget = async function(val) {
  this.targetAvg.sum -= val;
  this.targetAvg.count--;
  this.targetAvg.avg = this.targetAvg.sum / Math.max(1, this.targetAvg.count);
}

const Stock = mongoose.model('Stock', stockSchema)

module.exports = Stock;