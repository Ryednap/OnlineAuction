'use-strict';
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../../models/user');
const { settingPatchValidation } = require('../../utils/validation');
const { validateToken } = require('../../middleware/auth');


const settingRouter = express.Router();

settingRouter.patch('/settings', validateToken, async (req, res) => {
    // get the patch details from
    const patchDetails = req.body.patchDetails;
    console.log(patchDetails);

    // validate the content format from JOI
    const { error } = await settingPatchValidation(patchDetails);
    if (error) {
        return res.status(404).json({
            message: 'Invalid Details Please check again',
            error: error
        });
    }
    // get token and from token decode userId and find User
    const token = req.headers['x-access-token'] || req.body.token;
    const userDetails = jwt.decode(token, { complete: true }).payload;
    const user = await User.findOne(filter = { _id: userDetails._id });

    // Update the record
    User.updateOne(filter = { userName: user.userName, password: user.password }, patchDetails)
        .then((updatedUser) => {
            if (updatedUser.acknowledged) res.status(200).json({
                message: 'Details Updated Successfully',
            });
            else res.status(404).json({
                message: 'User not found',
            });
        })
        .catch((err) => {
            console.log(err)
            res.status(500).json({
                message: 'Internal Database error',
                error: err
            });
        });
});

module.exports = settingRouter;