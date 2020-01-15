const express = require('express');
const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');
const pread = require('../middleware/pread.js');
const pown = require('../middleware/pown.js');

const router = express.Router();

// POST /p/
// Creates a new portfolio
router.post('/p/', auth, async (req, res) => {
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

// DELETE /p/:id
// Deletes a portfolio
router.delete('/p/:id', auth, async(req, res) => {
  try {
    const {id} = req.params;
    writePortfolio(id, req.user, function(p) {
      p.remove();
      User.findOneAndUpdate(
        { _id: req.user._id }, 
        { $pull: { portfolios: id } },
        function (error) {
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

// GET p/:id
// Gets the portfolio object of the portfolio with given id
router.get('/p/:id', optauth, async(req, res) => {
  try {
    const {id} = req.params;
    readPortfolio(id, req.user, function(p) {
      res.send({ p });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// PUT p/:id
// Updates all of the following fields of the given portfolio:
//  - name, owner, public, desc
router.put('/p/:id', auth, async(req, res) => {
  try {
    const {id} = req.params;
    writePortfolio(id, req.user, function(p) {
      p.name = req.body.name ? req.body.name : p.name;
      p.owner = req.body.owner ? req.body.owner : p.owner;
      p.public = req.body.public ? req.body.public : p.public;
      p.desc = req.body.desc ? req.body.desc : p.desc;
      Portfolio.findOneAndUpdate(id, p, function(err) {
        if (err) { res.status(500).send(err); }
        res.send({ p });
      });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// POST p/:id/buys
// Adds/modifies the buy count of a stock
router.post('/p/:id/buys', auth, checkBuyFunds, async(req, res) => {
  try {
    const {id} = req.params;
    writePortfolio(id, req.user, function(p) {
      var oldCount = 0;
      p.buys.filter(buy => {
        if (buy.stock.toString() == req.body.stock) {
          oldCount = buy.count;
          return false;
        }
        return true;
      })
      if (req.body.count != 0) p.buys.push(req.body); // only add back if the count isn't zero
      p.save();

      // update stock's buy counts
      Stock.findById(req.body.stock, function(err, s) {
        if (err) {
          res.status(500).send(err);
          return;
        }
        s.buys[0] += req.body.count - oldCount;
        s.save();
        res.send({ p, s });
      })
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// POST p/:id/eyes
// Adds/removes (toggles) an eye
router.post('/p/:id/eyes', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {stockid} = req.body;
    writePortfolio(id, req.user, function(p) {
      const existed = false;
      p.eyes.filter(eye => {
        if (eye.toString() == stockid) {
          existed = true;
          return false;
        }
        return true;
      })
      p.eyes.push(stockid);
      p.save();

      //LEFT OFF: MODIFY STOCK EYE COUNT
      res.send({ p });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// POST p/:id/strats
// Adds a new strat (or update if tag already exists)
router.post('/p/:id/strats', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const strat = req.body;
    writePortfolio(id, req.user, function(p) {
      p.strats.filter((s) => s.tag != strat.tag); // removes the strat with this tag, if it exists
      p.strats.push(strat); // adds new strat
      p.save();
      res.send({ strat });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// DEL p/:id/strats
// Delete a strat (by tag)
router.delete('/p/:id/strats', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {tag} = req.body;
    writePortfolio(id, req.user, function(p) {
      p.strats.filter((s) => s.tag != tag); // removes the strat with this tag, if it exists
      p.save();
      res.send({ strat });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// POST p/:id/targets
// Add a new target price or modify existing one
router.post('/p/:id/targets', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const target = req.body;
    writePortfolio(id, req.user, function(p) {
      p.targets.filter((t) => t.stock.toString() != target.stock.toString()); // removes any target pertaining to this stock
      p.targets.push(target); // adds new target
      p.save();
      res.send({ target });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// DEL p/:id/targets
// Delete a target price
router.delete('/p/:id/targets', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {stock} = req.body;
    writePortfolio(id, req.user, function(p) {
      p.targets.filter(t => t.stock.toString() != stock.toString());
      p.save();
      res.send("Deleted");
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

// POST p/:id/contributions
// Add a new contribution
router.post('/p/:id/contributions', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const contr = req.body;
    writePortfolio(id, req.user, function(p) {
      p.overalls.contrHist.push(contr);
      p.save();
      res.send({ contr });
    })
  } catch (error) {
    res.status(400).send(error);
  }
})

//Gets a portfolio for writing
function writePortfolio(id, user, callback) {
  try {
    Portfolio.findById(id, function(err, p) {
      if (err) {
        res.status(500).send(err);
        return;
      } 
      if (!p) {
        res.status(400).send("Portfolio not found");
        return;
      }
      if (!p.canWrite(user)) {
        res.status(500).send("Unauthorized");
        return;
      }
      callback(p);
    })
  } catch (error) {
    res.status(500).send(error);
  }
}

//Gets a portfolio for reading
function readPortfolio(id, user, callback) {
  try {
    Portfolio.findById(id, function(err, p) {
      if (err) {
        res.status(500).send(err);
        return;
      } 
      if (!p) {
        res.status(400).send("Portfolio not found");
        return;
      }
      if (!p.canRead(user)) {
        res.status(500).send("Unauthorized");
        return;
      }
      callback(p);
    })
  } catch (error) {
    res.status(500).send(error);
  }
}

module.exports = router;