'use strict';

require('dotenv').config()

const FrontPage = require('./frontPage');
const ApplicationManager = require("./applicationManager");


/**
 * Main Function for Running the application
 * @returns {Promise<void>}
 */
async function main() {
    await ApplicationManager.forward(new FrontPage(), 1e-10);
}

module.exports = main;
