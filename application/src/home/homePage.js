'use strict';

const inquirer = require('inquirer');
const figlet = require('figlet');
const colorette = require('colorette');
const path = require('path');
const term = require('terminal-kit').terminal;
const clear = require('clear');

const question = {
    type: 'list',
    name: 'option',
    message: colorette.italic(colorette.redBright('Please Select option\n\n')),
    choices: ['Auction', 'Your Items', 'Transaction History', 'Settings', 'Exit']
};

async function homePage() {
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
        case "Auction": console.log('Auction'); break;
        case "Your Items": console.log("Your Items"); break;
        case "Transaction History": console.log("history"); break;
        case "Settings": console.log("setting"); break;
        default: console.log("Something Went wrong");
    }
}

homePage();
module.exports = homePage;