const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Re = require('../models/Re');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');
const validator = require('validator')

const router = express.Router();

// POST users
// Registers a user
// Takes user object
// Gives the logged in user info and their generated token
router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    user.admin = false;
    await user.save();
    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST users/login
// Logs in a registered user
// Takes 
//  - email: user's email
//  - password: password attempt
// Gives
//  - user: object of user logged in
//  - token: access token just generated
router.post('/users/login', async(req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    if (!user) {
      return res.status(500).send("Fatal: no user found matching credentials");
    }
    const token = await user.generateAuthToken();
    const hour = 1000 * 60 * 60;
    res.status(200).send({ user, token });
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// GET users/me
// Gets the user object of the current user
router.get('/users/me', auth, async(req, res) => {
  // View logged in user profile
  res.status(200).send(req.user);
})

// POST users/me/logout
// Logs out user from current device (deletes access token in request)
router.post('/users/me/logout', auth, async (req, res) => {
  // Log user out of the application
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
        return token.token != req.token;
    })
    await req.user.save();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST users/me/logoutall
// Logs out user from all devices (deletes all access tokens)
router.post('/users/me/logoutall', auth, async(req, res) => {
	// Log user out of all devices
	try {
    req.user.tokens.splice(0, req.user.tokens.length);
    await req.user.save();
    res.status(200).send();
	} catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
	}
})

// GET users/:id
// Gets info about the given user.
// Params 
//  - id: user id
// Gives user object
router.get('/users/:id', async(req, res) => {
	try {
		const id = req.params.id;
		User.findById(id, function(err, user) {
			if (err) {
				res.status(500).send("Fatal: " + err);
			} 
			if (!user) {
				res.status(400).send("Fatal: user not found");
			}
			res.status(200).send(user);
		})
	} catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
	}
});

// PUT /users/email
// Change user email
router.put('/users/email', auth, async(req, res) => {
  try {
    const {email} = req.body;
    if (!validator.isEmail(email)) {
      res.status(500).send("Fatal: email invalid");
    }
    req.user.email = email;
    await req.user.save();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// PUT /users/password
// Change user password
router.put('/users/password', auth, async(req, res) => {
  try {
    const {password} = req.body;
    req.user.password = password;
    await req.user.save();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST /users/follow/:id
// Follow/unfollow a portfolio
router.post('/users/follow', auth, async(req, res) => {
  try {
    const pid = req.params.id;
    const oldLength = req.user.following.length();

    req.user.following.filter(p => p.toString() != pid);
    const removed = (oldLength - req.user.following.length() === 1);

    Portfolio.findById(pid, function(err, p) {
      if (err || !p) {
        const errMsg = "Fatal: " + err ? err : "Portfolio not found";
        res.status(500).send(errMsg);
        return;
      }
      if (removed) {
        p.followers -= 1;
      } else {
        req.user.following.push(mongoose.Types.ObjectId(pid));
        p.followers += 1;
      }
      await req.user.save();
      await p.save();
      res.status(200).send(req.user);
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// PUT /users/bio
// Change user bio
router.put('/users/bio', auth, async(req, res) => {
  try {
    const {bio} = req.body;
    req.user.bio = bio;
    await req.user.save();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// PUT /users/settings
// Change user feed settings
router.put('/users/settings', auth, async(req, res) => {
  try {
    const {settings} = req.body;
    req.user.feedSettings = settings;
    await req.user.save();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

// POST /users/re/:id
// Toggles a re by id
router.post('/users/re/:id', auth, async(req, res) => {
  try {
    const reid = req.params.id;
    const oldLength = u.rebuys.length();

    req.user.rebuys.filter(re => re.toString() != reid);
    const removed = (req.user.rebuys.length() - oldLength === 1);

    // add/subtract to # of buys on re
    Re.findById(reid, function(err, re) {
      if (err || !p) {
        const errMsg = "Fatal: " + err ? err : "Portfolio not found";
        res.status(500).send(errMsg);
        return;
      }
      if (!removed) {
        req.user.rebuys.push(mongoose.Types.ObjectId(reid));
        re.buys += 1;
      } else {
        re.buys -= 1;
      }
      await req.user.save();
      await re.save();
      res.status(200).send({reid});
    })
  } catch (error) {
    res.status(500).send("Fatal: caught error. Msg: " + error);
  }
})

module.exports = router;