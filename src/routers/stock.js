const express = require('express');
const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const User = require('../models/User');
const adminauth = require('../middleware/adminauth');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');
const pread = require('../middleware/pread.js');
const pown = require('../middleware/pown.js');

const router = express.Router();

// POST /stocks/
// Create a stock
router.post('/stocks/', adminauth, async(req, res) => {
  try {
    const stock = new Stock(req.body);
    await stock.save();
    res.status(201).send({ stock });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /stocks/
// Get all stocks
router.get('/stocks', async(req, res) => {
  try {
    const stocks = await Stock.find({});
    if (!stocks) {
      res.status(500).send("Stocks not found");
      return;
    }
    res.status(200).send({ stocks });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /stocks/:ticker
// Get a stock by ticker
router.get('/stocks/:ticker', async(req, res) => {
  try {
    const ticker = req.params.ticker;
    const stock = Stock.findOne({ ticker: ticker });
    if (!stock) {
      res.status(500).send("Stock not found");
      return;
    }
    res.status(200).send({ stock });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /stocks/industry/:industry
// Get a stock by industry
router.get('/stocks/industry/:industry', async(req, res) => {
  try {
    const industry = req.params.industry;
    Stock.find({ industry: industry }, async(err, stocks) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.status(200).send({ stocks });
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

module.exports = router;