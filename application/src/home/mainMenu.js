'use strict';

// Library Import
const inquirer = require('inquirer');
const figlet = require('figlet');
const colorette = require('colorette');
const path = require('path');
const term = require('terminal-kit').terminal;
const clear = require('clear');

// Module import
const AuctionMenu = require('../auction/auctionMenu');
const ProgressBar = require('../../utils/progressBar');

const question = {
    type: 'list',
    name: 'option',
    message: colorette.italic(colorette.redBright('Please Select option\n\n')),
    choices: ['Auction', 'Your Items', 'Transaction History', 'Settings', 'Exit']
};

function runApp(classObject) {
    try {
        const progressBar = new ProgressBar(classObject.start.bind(classObject));
        progressBar.run({
            width: 100,
            title: '\n\n\t\tLOADING\t\t',
            eta: true,
            percent: true,
            titleStyle: term.bold.brightMagenta,
            barStyle: term.brightCyan
        });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

async function mainMenu() {
    clear();
    const data = figlet.textSync('WELCOME --!', {
        font: 'Standard',
        horizontalLayout: 'fitted',
        verticalLayout: 'full',
        whitespaceBreak: true,

    });
    // console.log(colorette.bold(colorette.yellowBright(data)));
    await term.slowTyping(data + "\n\n", {
        delay: 10,
        style: term.bold.brightYellow
    });
    const answer = await inquirer.prompt(question);
    switch (answer['option']) {
        case "Auction": runApp(new AuctionMenu()); break;
        case "Your Items": console.log("Your Items"); break;
        case "Transaction History": console.log("history"); break;
        case "Settings": console.log("setting"); break;
        case "Exit" : process.exit(0); break;
        default: console.log("Something Went wrong");
    }
}

module.exports = mainMenu;