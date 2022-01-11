const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { loginValidation, registerValidation } = require('../../utils/validation');
const User = require('../../models/user');
const router = express.Router({ caseSensitive: true, strict: false });


router.post('/api/register', async (req, res) => {

    // create userDetails object from req 

    let userDetails = {
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role
    };

    // Check if the userDetails format is correct or not with JOI
    const { error } = await registerValidation(userDetails);
    if (error) {
        res.status(400).json({
            message: 'Bad Request',
            error: error
        });
        return;
    }

    // assert that the details entered is unique 
    User.assertUnique(userDetails).then((data) => {
        if (!data) {
            res.status(400).json({
                message: 'Bad Request',
                error: 'One or More credentials already exits'
            });
            return;
        }

        // hash the password using bcryptJS
        const salt = bcrypt.genSaltSync(10);
        userDetails.password = bcrypt.hashSync(userDetails.password, salt);

        // Create new document in mongoDB table
        User.create(userDetails).then((data) => {
            res.status(201).json({
                message: 'User created Successfully Please Login!!',
                user: data
            });

        }).catch((err) => {
            console.log('Error  creating user data')
            res.status(500).json({
                message: 'Internal Error Creating User',
                error: err
            })
        });

    }).catch((err) => {
        res.status(500).json({
            message: 'Internal Error validating User details',
            error: err
        });
    });
});


router.post('/api/login', async (req, res) => {
    // create UserDetails
    const userDetails = {
        userName: req.body.userName,
        password: req.body.password,
        role: req.body.role
    };

    // Verify the details pattern
    const { error } = await loginValidation(userDetails);
    if (error) {
        res.status(400).json({
            message: 'Bad Request',
            error: error
        });
        return;
    }

    // Find the user via database Query
    User.findOne({ userName: userDetails.userName }).then((user) => {

        // check if the hash and the password provided by user matches
        if (!user || !bcrypt.compareSync(userDetails.password, user.password)) {
            res.status(404).json({
                message: 'Request User not found',
                error: 'Incorrected Password or userName'
            });

        } else {
            // generate new token for user to authenticate
            const token = jwt.sign({ _id: user._id, role: user.role },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "24h"
                }
            );
            res.status(200).json({
                message: 'Successfully Logged In',
                token: token
            });
        }

    }).catch((err) => {
        console.log(err);
        res.status(500).json({
            message: 'Internal error',
            error: err
        })
    });
});

module.exports = router;