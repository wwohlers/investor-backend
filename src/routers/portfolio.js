const express = require('express');
const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');
const pread = require('../middleware/pread.js');
const pown = require('../middleware/pown.js');

const router = express.Router();

router.post('/p/new', auth, async (req, res) => {
  try {
    req.body.owner = req.user._id;
    const p = new Portfolio(req.body);
    await p.save();

    User.findOneAndUpdate(
      { _id: req.user._id }, 
      { $push: { portfolios: p._id } },
      function (error, success) {
        if (error) {
            console.log(error);
            throw new Error;
        }
      });
    res.status(201).send({ p });
  } catch (error) {
    res.status(400).send(error);
  }
})

/*





LEFT OFF: NEED TO PULL FROM USER PORTFOLIOS ARRAY UPON DELETION. THEN TEST EVERYTHING




*/
router.post('/p/del', auth, async(req, res) => {
  try {
    const id = req.body.id;
    Portfolio.findById(id, function (e, p) {
      if (e) { res.status(400).send(e); }
      if (!p) { res.status(400).send("Portfolio not found"); }
      if (!p.canRead(req.user)) {
        res.status(500).send("Unauthorized");
      }
      Portfolio.findByIdAndDelete(id);
      User.findOneAndUpdate(
        { _id: req.user._id }, 
        { $pull: { portfolios: id } },
        function (error, success) {
          if (error) {
            res.status(500).send(error);
          }
          res.send("Deleted");
        }
      );
    })
  } catch (error) {
      res.status(400).send(error);
  }
})

// p/summary: get the rundown of the portfolio.
// takes
//  - id: portfolio id
// gives
//  - p .name .netValue
router.get('/p/summary', optauth, async(req, res) => {
  try {
    const id = req.body.id;
    Portfolio.findById(id, 'name owner netValue', function(err, p) {
      if (err) { res.status(500).send(err); }
      if (!p) { res.status(400).send("Portfolio not found"); }
      if (!p.canRead(req.user)) {
        res.status(500).send("Unauthorized");
      }
      res.send({ p })
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// p/summaries: get the rundown of all portfolios in an array of portfolio ids
// takes
//  - ids: portfolio ids
// gives
//  - [p .name .netValue]
router.get('/p/summaries', optauth, async (req, res) => {
  try {
    const ids = req.body.ids;
    var summs = [];
    ids.forEach(pid => {
      Portfolio.findById(pid, 'name owner netValue', function(err, p) {
        if (err) { res.status(500).send(err); }
        if (!p) { res.status(400).send("Portfolio not found"); }
        if (!p.canRead(req.user)) { res.status(500).send("Unauthorized"); }
        summs.push(p);
        res.send({ summs });
      })
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

module.exports = router;