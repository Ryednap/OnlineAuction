'use strict';

// Library import
const inquirer = require('inquirer');
const clear = require('clear');
const sleep = require('sleep');
const {terminal: term} = require("terminal-kit");

// Module import
const { postRequest, getRequest} = require('../api/apiReq');
const { writeCacheData } = require('../utils/cache');
const logger = require("../utils/logger");
const ApplicationManager = require("./applicationStack");
const MainMenu = require('./home/mainMenu');


/**
 * On Screen question before user is allowed to enter their
 * credentials. This allows user to quit or enter the credentials
 * @type {{name: string, type: string, choices: string[]}}
 */
const screenQuestion = {
    type: 'rawlist',
    name: 'option',
    choices: ['back', 'enter']
};

/**
 * Questions to be inquired through inquirer for SignIn
 * The verification of the input is done on server-side
 * @type {[
 *      {name: string, type: string},
 *      {name: string, type: string},
 *      {name: string, type: string}
 * ]}
 */
const signinQuestion = [
    {
        type: 'input',
        name: 'userName'
    },
    {
        type: 'password',
        name: 'password'
    },
    {
        type: 'input',
        name: 'role'
    }
];

/**
 * Question to be asked during SignUp using Inquirer
 * Verification is automatically done on the server-side
 * @type {[
 *      {name: string, type: string},
 *      {name: string, type: string},
 *      {name: string, type: string},
 *      {name: string, type: string, choices: string[]}
 * ]}
 */

const signupQuestion = [
    {
        type: 'input',
        name: 'userName'
    },
    {
        type: 'input',
        name: 'email'
    },
    {
        type: 'password',
        name: 'password'
    },
    {
        type: 'rawlist',
        name: 'role',
        choices: ['seller', 'buyer', 'admin']
    }
];

/**
 * Entry Manager
 * @class
 * @classdesc: Manages the user entry to the private route of HomeScreen
 *
 */

module.exports = class EntryManager {
    /**
     * state of the class after SignIn or SignUp
     * initially "pending"
     * @type {string}
     * @access public
     */
    state;


    /**
     * @constructor: Initializes the initial state as 'pending'
     * Binds the recursive Function of SignIn and SignUp to this.
     */
    constructor() {
        this.state = 'pending';
        this.SignIn = this.SignIn.bind(this);
        this.SignUp = this.SignUp.bind(this);
    }

    /**
     * start method for the class which gets invoked from ApplicationManager
     * @param funcName {string}
     * @returns {Promise<void>}
     */
    async start (funcName) {
        logger.info.info(`args of entry : ${funcName}`);
        if (funcName === 'Signin') {
            await this.SignIn();
            if (this.state === 'back') await ApplicationManager.back();
            else await ApplicationManager.forward(new MainMenu(), 20);
        }
        else {
            await this.SignUp();
            if (this.state !== 'back') {
                await ApplicationManager.back();
                await term.slowTyping(
                    'Registration Successful Please Login to Continue\n\n',
                    {
                        flashStyle: term.brightWhite,
                        delay: 50,
                        style: term.brightMagenta.bold
                    }
                )
            }
            await ApplicationManager.back();
        }
    }

    /**
     * SignIn function for EntryManager
     * it prompts for user for screenQuestion, if user continues
     * then prompts for credentials.
     * Then, creates postRequest for authorization and getRequest for getting user details.
     * If response from server is not 200 or OK then recurse again,
     * otherWise set the status as forward  and returns
     *
     * Note, that if user chooses "back" then we immediately set the state as "back" and return
     * @access public
     * @returns {Promise<void>}
     */
    async SignIn() {
        clear();
        const answer = await inquirer.prompt(screenQuestion);
        if (answer['option'] !== 'back') {
            const credentials = await inquirer.prompt(signinQuestion);
            const req = await postRequest(credentials, "/entry/api/login");
            const res = await req.json();
            const userReq = await getRequest("/entry/api/detail/" + credentials.userName, false);
            const userRes = await userReq.json();
            logger.info.info(`req status: ${req.status}`);
            if (req.status !== 200) {
                console.log(req.message);
                sleep.sleep(1);
                await this.SignIn();
            } else {
                writeCacheData("token", res['token']);
                writeCacheData("user", userRes);
                this.state = 'forward';
            }
        } else {
            this.state = 'back';
        }
    }

    async SignUp() {
        clear();
        const answer = await inquirer.prompt(screenQuestion);
        if (answer['option'] === 'back') {
            this.state = 'back';
        } else {
            const credentials = await inquirer.prompt(signupQuestion);
            const req = await postRequest(credentials, "/entry/api/register");
            if (req.status !== 200) {
                const res = await req.json();
                console.log("\n", res);
                setTimeout( () => this.SignUp, 2000);
            } else {
                this.state = 'forward';
            }
        }
    }
    toString() {
        return `EntryManager: state: ${this.state}`;
    }
    destroy () {
        logger.info.info('Deleted Entry Manager');
    }
}
