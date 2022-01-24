'use strict';

require('dotenv').config()
const frontPageDrawer = require('./frontPage');
const { Signin, Signup } = require('./entry');

async function main() {
    const answer = await frontPageDrawer();
    switch (answer['option']) {
        case 'Signin': await Signin(); break;
        case 'Signup': await Signup(); break;
        case 'Exit': process.exit(0); break;
        default: console.log('none matched');
    }
}

module.exports = main;