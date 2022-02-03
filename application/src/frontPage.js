/**
 * FrontPage for the application. This module is by default
 * the first Screen and is always present inside the applicationStack
 * The Screen allows user's to choose one of the option to login, SignUp or quit
 * @module FrontPage
 */

'use strict';

const inquirer = require('inquirer');
const colorette = require('colorette');
const figlet = require('figlet');
const centerAlign = require('center-align');
const clear = require('clear');

const ApplicationManager = require('./applicationStack');
const EntryManager = require("./entryManager");

class FrontPage {
    /**
     * Question parameter to be use to inquire user through inquirer.js
     * @type {[{name: string, type: string, message: *, choices: string[]}]}
     */
    #question = [
        {
            type: 'list',
            name: 'option',
            message: colorette.whiteBright('Please Select option\n'),
            choices: ['Signin', 'Signup', 'Exit']
        }
    ]

    /**
     * Pushes the current context into ApplicationManager
     * @constructor
     */
    constructor() {
        ApplicationManager.forward(this, 1e-10);
        this.start = this.start.bind(this);
        this.toString = this.toString.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    /**
     * start function for the class
     * @access public
     * @returns {Promise<void>}
     */
    async start () {
        clear();
        const data = figlet.textSync('GENKO AUCTION', {
            font: 'Standard',
            horizontalLayout: 'fitted',
            verticalLayout: 'full',
            whitespaceBreak: true,

        });
        console.log(centerAlign(colorette.magentaBright(
            colorette.bold(data)
        ), 80));

        console.log(
            centerAlign(colorette.yellowBright('Automatic Auction at Ease'), 100)
        );
        console.log(
            centerAlign(colorette.redBright('Sell More, Buy Better!!\n\n\n'), 95)
        );

        const answer = await inquirer.prompt(this.#question);
        if (answer['option'] === 'Exit') {
            await ApplicationManager.back();
        } else {
            const entry = new EntryManager();
            await ApplicationManager.forward(entry, 1, answer['option']);
        }
    }
    toString() {
        return 'FrontPage';
    }
    destroy () {}
}

module.exports = FrontPage;
