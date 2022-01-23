'use strict';

require('dotenv').config()
const frontPageDrawer = require('./frontPage');
const { Signin, Signup } = require('./entry');

async function main() {
    const answer = await frontPageDrawer();
    switch (answer['option']) {
        case 'Signin': Signin(); break;
        case 'Signup': Signup(); break;
        case 'Exit': process.exit(0);
        default: console.log('none matched');
    }
}

module.exports = main;