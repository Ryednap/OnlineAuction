'use strict';

require('dotenv').config()

const FrontPage = require('./frontPage');


/**
 * Main Function for Running the application
 * @returns {Promise<void>}
 */
async function main() {
    new FrontPage();
}

module.exports = main;
