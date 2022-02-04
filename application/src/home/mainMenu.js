'use strict';

// Library Import
const inquirer = require('inquirer');
const figlet = require('figlet');
const colorette = require('colorette');
const term = require('terminal-kit').terminal;
const clear = require('clear');

// Module import
const AuctionMenu = require('../auction/auctionMenu');
const Settings = require('../settings/setting');
const ApplicationManager = require("../applicationManager");
const logger = require("../../utils/logger");


/**
 * menu question to be inquired on mainMenu
 * @type {
 *      {
 *          name: string,
 *          type: string,
 *          message: string,
 *          choices: string[]
 *      }
 *   }
 */

const question = {
    type: 'list',
    name: 'option',
    message: colorette.italic(colorette.redBright('Please Select option\n\n')),
    choices: ['Auction', 'Your Items', 'Transaction History', 'Settings', 'Back']
};

/**
 * MainMenu
 * @class
 * @classDesc Renders the main-menu content on the terminal screen
 */

module.exports = class MainMenu {
    /**
     * count
     * @type {number}
     *
     * Maintains the instance count for the class, used to decide whether it's the first
     * instance or not which in turn is used to decide whether to animate the welcome text
     * or present it as baked.
     */
    static count = 0;

    /**
     * Constructor for MainMenu class.
     * Binds the class functions (necessary as they are called as callback from different module)
     * @constructor
     */
    constructor() {
        this.start = this.start.bind(this);
        this.destroy = this.destroy.bind(this);
        this.toString = this.toString.bind(this);
    }


    /**
     * Start
     * @function
     * Driver function for the class
     * @returns {Promise<void>}
     */
    async start () {
       clear();
       ++MainMenu.count;
       // figlet text data.
       const data = figlet.textSync('WELCOME --!', {
           font: 'Standard',
           horizontalLayout: 'fitted',
           verticalLayout: 'full',
           whitespaceBreak: true,

       });

       // screen text display
       if (MainMenu.count === 1) {
           await term.slowTyping(data + "\n\n", {
               delay: 10,
               style: term.bold.brightYellow
           });
       } else console.log(colorette.bold(colorette.yellowBright(data + '\n\n')));

       // prompt the menu and decide the answer
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

    /**
     * toString overrides the default toString for the object of the class.
     * Used for logging.
     * @override
     * @returns {string}
     */
   toString () {
       return `Main Menu class`;
   }

    /**
     * Destructor function called from the stack manager to clear the events, schedules, intervals
     * etc.
     * @function
     */
   destroy () {
        logger.info.info('Entry Manager destroyed');
   }
}

