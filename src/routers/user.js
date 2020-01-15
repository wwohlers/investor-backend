const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');

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
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
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
            return res.status(401).send({error: 'Login failed! Check authentication credentials'})
        }
        const token = await user.generateAuthToken();
        const hour = 1000 * 60 * 60;
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }

})

// GET users/me
// Gets the user object of the current user
router.get('/users/me', auth, async(req, res) => {
    // View logged in user profile
    res.send(req.user);
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
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
})

// POST users/me/logoutall
// Logs out user from all devices (deletes all access tokens)
router.post('/users/me/logoutall', auth, async(req, res) => {
	// Log user out of all devices
	try {
			req.user.tokens.splice(0, req.user.tokens.length);
			await req.user.save();
			res.send();
	} catch (error) {
			res.status(500).send(error);
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
				res.status(500).send(err);
			} 
			if (!user) {
				res.status(400).send("User not found");
			}
			res.send(user);
		})
	} catch (error) {
		res.status(500).send(err);
	}
});

// PUT /users/
// Updates user
router.put('/users/', auth, async(req, res) => {
  try {
    const user = req.body;
    user.admin = false;
    User.findById(id, function(err, u) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      u = user;
      u.save();
    })
  } catch (error) {
    res.status(500).send(error);
  }
})

module.exports = router;