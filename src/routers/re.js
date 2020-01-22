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
    for (var i = 0; i < re.res.length; i++) {
      const r = re.res[i];
      let failure = false;
      if (r.type == "s") {
        failure = !(await Stock.exists({_id: r.refid}));
      } else if (r.type == "p") {
        failure = !(await Portfolio.exists({_id: r.refid}));
      } else {
        failure = !(await Re.exists({_id: r.refid}));
      }
      if (failure) {
        res.status(500).send("Fatal: failed to identify re with type '" + r.type + "' and id " + r.refid);
        return;
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
router.get('/res/:id', async(req, res) => {
  try {
    const id = req.params.id;
    const re = await Re.findById(id);
    if (!re) {
      res.status(500).send("Re not found");
      return;
    }
    res.status(200).send({re});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /res/user/:id
// Get res authored by a user
router.get('/res/users/:id', async(req, res) => {
  try {
    const userid = mongoose.Types.ObjectId(req.params.id);
    const rs = await Re.find({author: userid})
    if (!rs) {
      res.status(500).send("No res found");
      return;
    }
    res.status(200).send({rs});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET /res/:type/:refid
// Get res with a re pertaining to a given :type with given :id
router.get('/res/:type/:refid', async(req, res) => {
  try {
    const {type, refid} = req.params;
    let rs = await Re.find({});
    if (err) {
      res.status(500).send(err);
      return;
    }
    rs = rs.filter(re => {
      return re.res.some(ref => {
        return ref.refid.toString() == refid && ref.type == type;
      })
    });
    res.status(200).send({rs});
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

module.exports = router;