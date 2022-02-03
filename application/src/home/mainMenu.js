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
const Settings = require('../settings/setting');
const ApplicationManager = require("../applicationStack");
const logger = require("../../utils/logger");

const question = {
    type: 'list',
    name: 'option',
    message: colorette.italic(colorette.redBright('Please Select option\n\n')),
    choices: ['Auction', 'Your Items', 'Transaction History', 'Settings', 'Back']
};

module.exports = class MainMenu {
    static count = 0;
    constructor() {
        ++MainMenu.count;
        this.start = this.start.bind(this);
        this.destroy = this.destroy.bind(this);
        this.toString = this.toString.bind(this);
    }

   async start () {
       clear();
       const data = figlet.textSync('WELCOME --!', {
           font: 'Standard',
           horizontalLayout: 'fitted',
           verticalLayout: 'full',
           whitespaceBreak: true,

       });
       if (MainMenu.count === 1) {
           await term.slowTyping(data + "\n\n", {
               delay: 10,
               style: term.bold.brightYellow
           });
       } else console.log(colorette.bold(colorette.yellowBright(data + '\n\n')));

       const answer = await inquirer.prompt(question);
       switch (answer['option']) {
           case "Auction": await ApplicationManager.forward(new AuctionMenu(), 10); break;
           case "Your Items": console.log("Your Items"); break;
           case "Transaction History": console.log("history"); break;
           case "Settings": await ApplicationManager.forward(new Settings(), 10); break;
           case "Back" : await ApplicationManager.back(); break;
           default: console.log("Something Went wrong");
       }
   }

   toString () {
       return `Main Menu class`;
   }

   destroy () {
        logger.info.info('Entry Manager destroyed');
   }
}

