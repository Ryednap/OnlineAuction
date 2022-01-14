'use strict';

const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment');

const validateToken = require('../../middleware/auth');
const { auctionModel } = require('../../models/auction_model');
const auctionRouter = express.Router();

auctionRouter.get('/list', validateToken, (req, res) => {
    auctionModel.find({}).then((docs) => {
        let auctionList = new Array();
        docs.forEach((doc) => {
            delete doc.itemListing
            auctionList.push(doc);
        });
        console.log(auctionList);
        res.status(200).json(JSON.stringify(auctionList));

    }).catch((err) => {
        console.log(err);
        res.status(500).json({
            message: 'Internal Server error',
            error: err
        });
    });
});

auctionRouter.get('/list:auctionId', validateToken, (req, res) => {
    const auctionId = req.params.auctionId;
    auctionModel.findOne({ _id: auctionId }).then((doc) => {
        res.status(200).json(doc);
    }).catch((err) => {
        console.log(err);
        res.status(500).json({
            message: 'Internal Server Error',
            error: err
        });
    })
});

auctionRouter.post('/api/add', (req, res) => {
    const id = crypto.randomBytes(14).toString('hex');
    const auctionDoc = {
        _id: id,
        name: req.body.name,
        startsAt: moment()
    }
    auctionModel.create(auctionObject)
})

module.exports = auctionRouter;