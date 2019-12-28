const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const optauth = require('../middleware/optauth');

const router = express.Router();

router.post('/users', async (req, res) => {
    // Create a new user
    try {
        const user = new User(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
})

router.post('/users/login', async(req, res) => {
    //Login a registered user
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

router.get('/users/me', auth, async(req, res) => {
    // View logged in user profile
    res.send(req.user);
})

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

// users/p: gets all the portfolios owned by a given user.
// takes 
//  - id: user id
// gives
//  - array of portfolio ids
router.get('/users/p', async(req, res) => {
	try {
		const id = req.body.id;
		User.findById(id, 'portfolios', function(err, user) {
			if (err) {
				res.status(500).send(err);
			} 
			if (!user) {
				res.status(400).send("User not found");
			}
			res.send(user.portfolios); 
		})
	} catch (error) {
		res.status(500).send(err);
	}
})

module.exports = router;