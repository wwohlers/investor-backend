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

    let p = new Object;
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

// GET /p/
// Gets all portfolios
router.get('/p/', async(req, res) => {
  try {
    const ps = await Portfolio.find({}, 'id name owner')
    if (!ps) {
      res.status(500).send("Portfolios not found");
      return;
    }
    res.send(ps);
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// DELETE /p/:id
// Deletes a portfolio
router.delete('/p/:id', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    p.remove();

    req.user.portfolios = req.user.portfolios.filter(p => p.id.toString() != id);
    req.user.save();

    res.status(200).send("Deleted");
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET p/:id
// Gets the portfolio object of the portfolio with given id
router.get('/p/:id', optauth, async(req, res) => {
  try {
    const {id} = req.params;
    const p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canRead(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    res.status(200).send({ p });
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
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    p.name = name;
    p.public = public;
    p.desc = desc;
    await p.save();
    res.status(200).send({p});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST p/:id/buys
// Adds/modifies the buy count of a stock, takes added count and price (NOT average price)
// E.g. {buyPx: 50, count: 100} means adding 100 shares at the current price of 50, both numbers regardless of previous buys
router.post('/p/:id/buys', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {stock, buyPx, count} = req.body;
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
      
    let s = await Stock.findById(stock);
    if (!s) {
      res.status(500).send("Stock not found");
      return;
    }

    if (p.buys.length === 0) {
      const stockid = mongoose.Types.ObjectId(stock);
      p.buys.push({stock: stockid, buyPx: buyPx, count: count});
    } else {
      for (var i = 0; i < p.buys.length; i++) {
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
    }

    //update stock buy counts
    const oldCount = s.buys.shift();
    s.buys.unshift(oldCount + count);

    await s.save();
    await p.save();    
    res.status(200).send({ p, s });
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
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    
    let s = await Stock.findById(stock);
    if (!s) {
      res.status(500).send("Stock not found");
      return;
    }

    const oldLength = p.eyes.length;
    p.eyes = p.eyes.filter(eye => {eye.toString() != s.id.toString()})
    const existed = (oldLength - p.eyes.length == 1);

    const oldCount = s.eyes.shift();
    if (!existed) {
      p.eyes.push(mongoose.Types.ObjectId(s.id));
      s.eyes.unshift(oldCount + 1);
    } else {
      s.eyes.unshift(oldCount - 1);
    }

    await p.save();
    await s.save();    
    res.status(200).send({ p, s });
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
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    p.strategies = p.strategies.filter((s) => s.tag != strat.tag); // removes the strat with this tag, if it exists
      
    for (var i = 0; i < strat.stocks.length; i++) {
      let s = await Stock.findById(strat.stocks[i]);
      if (!s) {
        res.status(500).send("Stock not found");
        return;
      }
      strat.stocks[i] = s._id;
    }
    p.strategies.push(strat); // adds new strat

    await p.save();
    res.status(200).send({ p, strat });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// DEL p/:id/strats/
// Delete a strat (by tag)
router.delete('/p/:id/strats/', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const {tag} = req.body;
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    p.strategies = p.strategies.filter((s) => s.tag != tag);
    await p.save();
    res.status(200).send({ p });
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
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
      
    let stock = await Stock.findById(target.stock);
    if (!stock) {
      res.status(500).send("Stock not found");
      return;
    }

    for (var i = 0; i < p.targets.length; i++) {
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
    res.status(200).send({ p, stock });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// DEL p/:id/targets/:stock
// Delete a target price
router.delete('/p/:id/targets/:stock', auth, async(req, res) => {
  try {
    const {id, stock} = req.params;
    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    if (!p.targets.some(t => t.stock.toString() === stock)) {
      res.status(200).send("Fatal: No target exists for this stock");
      return;
    }

    // Can assume that the target existed
    const val = p.targets.find(t => t.stock.toString()).price;
    p.targets = p.targets.filter(t => t.stock.toString() != stock);

    let s = await Stock.findById(stock)
    if (!s) {
      res.status(500).send("Stock not found");
      return;
    }
    s.removeTarget(val);

    await s.save();
    await p.save();
    res.status(200).send({p, s});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST p/:id/contributions
// Add a new contribution (takes amount in body)
router.post('/p/:id/contributions', auth, async(req, res) => {
  try {
    const {id} = req.params;
    const contr = {amount: req.body.amount};
    contr.date = Date.now();

    let p = await Portfolio.findById(id);
    if (!p) {
      res.status(500).send("Portfolio not found");
      return;
    }
    if (!p.canWrite(req.user)) {
      res.status(500).send("Unauthorized");
      return;
    }
    const oldNet = p.overalls.netValue[0];
    if (oldNet + contr.amount > -1) {
      p.overalls.contrHist.push(contr);
      p.overalls.netValue.shift();
      p.overalls.netValue.unshift(oldNet + contr.amount);
      await p.save();
      res.status(200).send({ contr, p });
    } else {
      res.status(500).send("Error: withdrawal amount exceeds available funds")
    }
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

module.exports = router;