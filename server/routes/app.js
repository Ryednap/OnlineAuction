const express = require('express')
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
const authRouter = require('./public/entry');
const settingRouter = require('./private/settings');

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/entry', authRouter);
app.use('/home', settingRouter);

module.exports = app;