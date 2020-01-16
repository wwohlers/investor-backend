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

// GET /stocks/:ticker
// Get a stock by ticker
router.get('/stocks/:ticker', async(req, res) => {
  try {
    const ticker = req.params.ticker;
    Stock.findOne({ ticker: ticker }, function(err, stock) {
      if (err || !stock) {
        const errMsg = "Fatal: " + err ? err : "Stock not found";
        res.status(500).send(errMsg);
        return;
      }
      res.status(200).send({ stock });
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /stocks/industry/:industry
// Get a stock by industry
router.get('/stocks/:ticker', async(req, res) => {
  try {
    const industry = req.params.ticker;
    Stock.find({ industry: industry }, function(err, stocks) {
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