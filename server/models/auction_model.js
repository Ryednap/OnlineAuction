'use strict';

const mongoose = require('mongoose');

const transactionHistory = mongoose.Schema({
    seller: mongoose.Schema.Types.ObjectId,
    buyer: mongoose.Schema.Types.ObjectId,
    sellPrice: Number,
    auctionCharge: {
        type: Number,
        default: 5.00
    },
    paidToUser: {
        type: Number,
        default: function () {
            return this.sellPrice * (1 - this.auctionCharge);
        }
    },
});

const auctionSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    startsAt: {
        type: Date,
        required: true,
    },
    endsAt: {
        type: Date,
        required: true,
    },
    auctionCharge: {
        type: Number,
        default: 5.00
    },
    itemListing: [{
        type: mongoose.Schema.Types.ObjectId,
    }]
});

const auctionHistorySchema = mongoose.Schema({
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    transactionId: [{
        type: mongoose.Schema.Types.ObjectId,
    }]
});


auctionModel = mongoose.model('auction', auctionSchema);
auctionHistoryModel = mongoose.model('auctionHistory', auctionHistorySchema);
transactionHistoryModel = mongoose.model('transactionHistory', transactionHistory);

module.exports = { auctionModel, auctionHistoryModel, transactionHistoryModel };