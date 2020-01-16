const express = require('express');
const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const User = require('../models/User');
const Re = require('../models/Re');
const adminauth = require('../middleware/adminauth');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');
const pread = require('../middleware/pread.js');
const pown = require('../middleware/pown.js');

const router = express.Router();

// POST /res/
// Create a new re
router.post('/res/', auth, async(req, res) => {
  try {
    const re = new Re(req.body);
    re.author = req.user._id;
    re.buys = 0;
    for (var i = 0; i < re.res.length(); i++) {
      const r = re.res[i];
      const failure = false;
      if (r.type == "s") {
        failure = !(await Stock.exists({id: r.id}));
      } else if (r.type == "p") {
        failure = !(await Portfolio.exists({id: r.id}));
      } else {
        failure = !(await Re.exists({id = r.id}));
      }
      if (failure) {
        res.status(500).send("Fatal: failed to identify re with type '" + re.type + "' and id " + re._id);
      }
    }

    await re.save();
    res.status(200).send({re});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /res/:id
// Get re: by id
router.post('/res/:id', async(req, res) => {
  try {
    const id = req.params.id;
    Re.findById(id, function(err, re) {
      if (err || !re) {
        const errMsg = "Fatal: " + err ? err : "Re not found";
        res.status(500).send(errMsg);
        return;
      }
      res.status(200).send({re});
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /res/user/:id
// Get res authored by a user
router.get('/res/users/:id', async(req, res) => {
  try {
    const userid = mongoose.Types.ObjectId(req.params.id);
    Re.find({author: userid}, function(err, rs) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.status(200).send({rs});
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /res/:type/:id
// Get res with a re pertaining to a given :type with given :id
router.get('/re/sstock/:id', async(req, res) => {
  try {
    const stockid = req.params.id;
    const type = req.params.type;
    Re.find({}, function(err, rs) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      rs.filter(re => {
        return re.res.some(ref => {
          ref.id.toString() == stockid && ref.type == type;
        })
      });
      res.status(200).send({rs});
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})