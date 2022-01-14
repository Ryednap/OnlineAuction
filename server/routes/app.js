'use strict';

const express = require('express')
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
const authRouter = require('./public/entry');
const settingRoute = require('./private/settings');
const auctionRoute = require('./private/Auction');

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/entry', authRouter);
app.use('/home', settingRoute);
app.use('/auction', auctionRoute);

module.exports = app;