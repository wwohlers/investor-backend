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
    const {name, public, desc} = req.body;

    let p;
    p.owner = mongoose.Types.ObjectId(req.user.id);
    p.name = name;
    p.public = public;
    p.desc = desc;

    const portfolio = new Portfolio(p);
    await portfolio.save();

    req.user.portfolios.push(mongoose.Types.ObjectId(portfolio.id));
    await req.user.save();

    res.status(200).send({portfolio});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// DELETE /p/:id
// Deletes a portfolio
router.delete('/p/:id', auth, async(req, res) => {
  try {
    const {id} = req.params;
    writePortfolio(id, req.user, function(p) {
      p.remove();

      req.user.portfolios.filter(p => p.id.toString() != id);
      req.user.save();

      res.status(200).send("Deleted");
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET p/:id
// Gets the portfolio object of the portfolio with given id
router.get('/p/:id', optauth, async(req, res) => {
  try {
    const {id} = req.params;
    readPortfolio(id, req.user, function(p) {
      res.status(200).send({ p });
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// PUT p/:id
// Updates all of the following fields of the given portfolio:
//  - name, public, desc
router.put('/p/:id', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {name, public, desc} = req.body;
    writePortfolio(id, req.user, function(p) {
      p.name = name;
      p.public = public;
      p.desc = desc;
      await p.save();
      res.status(200).send({p});
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST p/:id/buys
// Adds/modifies the buy count of a stock, takes added count and price (NOT average price)
// E.g. {buyPx: 50, count: 100} means adding 100 shares at the current price of 50, both numbers regardless of previous buys
router.post('/p/:id/buys', auth, checkBuyFunds, async(req, res) => {
  try {
    const {id} = req.params;
    const {stock, buyPx, count} = req.body;
    writePortfolio(id, req.user, function(p) {
      Stock.findById(stock, function(err, s) {
        if (err || !s) {
          const errMsg = "Fatal: " + err ? err : "Stock not found";
          res.status(500).send(errMsg);
          return;
        }

        for (var i = 0; i < p.buys.length(); i++) {
          if (p.buys[i].stock.toString() == stock) {
            const oldCount = p.buys[i].count;
            const oldPx = p.buys[i].buyPx;
            const newCount = oldCount + count;
            if (newCount != 0) {
              const newPx = (oldCount * oldPx + count * buyPx) / (newCount);
              p.buys[i].count = newCount;
              p.buys[i].buyPx = newPx;
            } else {
              // the count is zero, so just remove it from buys
              p.buys.splice(i, 1);
              i--;
            }
          }
        }
        await p.save();

        //update stock buy counts
        s.buys[0] += count;
        await s.save();

        res.status(200).send({ p, s });
      })
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST p/:id/eyes
// Adds/removes (toggles) an eye
router.post('/p/:id/eyes', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {stock} = req.body;
    writePortfolio(id, req.user, function(p) {
      Stock.findById(stock, function(err, stock) {
        if (err || !stock) {
          const errMsg = "Fatal: " + err ? err : "Stock not found";
          res.status(500).send(errMsg);
          return;
        }

        const oldLength = p.eyes.length();
        p.eyes.filter(eye => {eye.toString() != stockid})
        const existed = (oldLength - p.eyes.length() == 1);

        if (!existed) {
          p.eyes.push(mongoose.Types.ObjectId(stockid));
          stock.eyes[0] += 1;
        } else {
          stock.eyes[0] -= 1;
        }

        await p.save();
        await stock.save();
        
        res.status(200).send({ p, stock });
      })
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
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
      for (var i = 0; i < strat.stocks.length(); i++) {
        Stock.findById(strat.stocks[i], function(err, s) {
          if (err || !s) {
            const errMsg = "Fatal: " + err ? err : "Stock not found";
            res.status(500).send(errMsg);
            return;
          }
          strat.stocks[i] = s._id;
        })
      }
      p.strats.push(strat); // adds new strat

      await p.save();
      res.status(200).send({ strat });
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// DEL p/:id/strats/:tag
// Delete a strat (by tag)
router.delete('/p/:id/strats/:tag', auth, async(req, res) => {
  try {
    const {id, tag} = req.params;
    writePortfolio(id, req.user, function(p) {
      p.strats.filter((s) => s.tag != tag); // removes the strat with this tag, if it exists
      p.save();
      res.status(200).send({ strat });
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST p/:id/targets
// Add/modify a target
router.post('/p/:id/targets', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const target = req.body;
    writePortfolio(id, req.user, function(p) {
      Stock.findById(target.stock, function(error, stock) {
        if (error || !stock) {
          const errMsg = "Fatal: " + err ? err : "Stock not found";
          res.status(500).send(errMsg);
          return;
        }

        for (var i = 0; i < p.targets.length(); i++) {
          if (p.targets[i].stock.toString() == target.stock) {
            stock.removeTarget(p.targets[i].price);
            p.targets.splice(i, 1);
            i--;
          }
        }

        target.stock = stock._id;
        p.targets.push(target); // adds new target
        stock.addTarget(target.price);

        await stock.save();
        await p.save();

        res.status(200).send({ target });
      })
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// DEL p/:id/targets
// Delete a target price
router.delete('/p/:id/targets/:stock', auth, async(req, res) => {
  try {
    const {id, stock} = req.params;
    writePortfolio(id, req.user, function(p) {
      if (!p.targets.find(t => t.stock.toString() === stock)) {
        res.status(200).send("Fatal: No target exists for this stock");
        return;
      }

      // Can assume that the target existed
      p.targets.filter(t => t.stock.toString() != stock);
      await p.save();

      Stock.findById(stock, function(error, stock) {
        if (error || !stock) {
          const errMsg = "Fatal: " + err ? err : "Stock not found";
          res.status(500).send(errMsg);
          return;
        }

        stock.removeTarget(target.price);
        await stock.save();

        res.status(200).send("Deleted");
      })
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST p/:id/contributions
// Add a new contribution
router.post('/p/:id/contributions', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const contr = req.body;
    contr.date = Date.now();

    writePortfolio(id, req.user, function(p) {
      p.overalls.contrHist.push(contr);
      p.overalls.netValue[0] += contr.amount;
      await p.save();
      res.status(200).send({ contr, p });
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// Gets a portfolio for writing
function writePortfolio(id, user, callback) {
  try {
    Portfolio.findById(id, function(err, p) {
      if (err || !p) {
        const errMsg = "Fatal: " + err ? err : "Portfolio not found";
        res.status(500).send(errMsg);
        return;
      }
      if (!p.canWrite(user)) {
        res.status(500).send("Unauthorized");
        return;
      }
      callback(p);
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
}

// Gets a portfolio for reading
function readPortfolio(id, user, callback) {
  try {
    Portfolio.findById(id, function(err, p) {
      if (err || !p) {
        const errMsg = "Fatal: " + err ? err : "Portfolio not found";
        res.status(500).send(errMsg);
        return;
      }
      if (!p.canRead(user)) {
        res.status(500).send("Unauthorized");
        return;
      }
      callback(p);
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
}

module.exports = router;