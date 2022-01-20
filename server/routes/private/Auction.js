'use strict';

const express = require('express');
const crypto = require('crypto');
const moment = require('moment');

const { auctionModel } = require('../../models/auction_model');
const auctionRouter = express.Router();

auctionRouter.get('/list', (req, res) => {
    auctionModel.find({}).then((docs) => {
        let auctionList = [];
        docs.forEach((doc) => {
            delete doc['_doc'].itemListing;
            auctionList.push(doc);
        });
        res.status(200).json(auctionList);

    }).catch((err) => {
        console.log(err);
        res.status(500).json({
            message: 'Internal Server error',
            error: err
        });
    });
});

auctionRouter.get('/list/:auctionId', (req, res) => {
    const auctionId = req.params.auctionId;
    console.log(auctionId);
    auctionModel.findOne({ _id: auctionId }).then((doc) => {
        console.log(doc);
        res.status(200).json(doc);
    }).catch((err) => {
        console.log(err);
        res.status(500).json({
            message: 'Internal Server Error',
            error: err
        });
    })
});

auctionRouter.post('/api/add', async (req, res) => {
    const id = crypto.randomBytes(14).toString('hex');
    const auctionDoc = {
        _id: id,
        name: req.body.name,
        startsAt: moment(req.startsAt).format('YYYY-MM-DD:HH::MM:SS'),
        endsAt: moment(req.endsAt).format('YYYY-MM-DD:HH::MM:SS'),
        auctionCharge: req.body.charge,
        itemListing: []
    };
    // Try to make auction not-running at same time
    // Todo : Make multithreading enabled feature to run multiple auction simultaneously
    try {
        const lhs = await auctionModel.find({
            startsAt: {
                $gte: moment(req.startsAt).toDate(),
                $lte: moment(req.endsAt).toDate(),
            }
        });
        const rhs = await auctionModel.find({
            endsAt: {
                $gte: moment(req.startsAt).toDate(),
                $lte: moment(req.startsAt).toDate(),
            }
        });
        if (lhs || rhs) {
            return res.status(400).json({
                message: 'Schedule class : One auction already scheduled during the period'
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Interval server error'
        });
    }
    auctionModel.create(auctionDoc).then((status) => {
        console.log(status);
        res.status(200).json({});
    }).catch((error) => {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server error',
            error: error
        });
    });
});

module.exports = auctionRouter;