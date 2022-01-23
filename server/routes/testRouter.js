const express = require('express');
const testRouter = express.Router();


const auction = require('../cron/auctionScheduler');
const moment = require('moment');

testRouter.get('/', (req, res) => {;

    const emitter =auction.scheduleAuction({
        id: '59978e712246959452f546528fae',
        startsAt: moment().format('YYYY-MM-DD HH:MM:SS'),
    });
    emitter.on('item-listed', () => {
        console.log('caught item-listed');
        setTimeout(() => {
            const bidData = {
                userId: '61e3d30556fc99cf4b149758',
                userName: 'Ujjwal',
                currentPrice: 340
            }
            emitter.emit('bid', bidData);
        }, 1000);
    })
    res.status(200).json({});
});

module.exports = testRouter;