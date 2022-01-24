'use strict';

// Library import
const inquirer = require('inquirer');
const term = require('terminal-kit').terminal;
const clear = require('clear');

// Module import
const { postRequest, getRequest} = require('../api/apiReq');
const { writeCacheData } = require('../utils/cache');
const main = require('./main');
const mainMenu = require('./home/mainMenu');
const ProgressBar = require('../utils/progressBar');

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



async function Signin() {
    clear();

    await term.slowTyping(
        'Please Enter your Credentials\n\n',
        {
            flashStyle: term.brightWhite,
            delay: 80,
            style: term.brightMagenta.bold
        }
    );
    const answer = await inquirer.prompt(signinQuestion);
    const req = await postRequest(answer, "/entry/api/login");
    const res = await req.json();

    const userReq = await getRequest("/entry/api/detail/" + answer.userName, false);
    const userRes = await userReq.json();
    if (req.status !== 200) {
        console.log("\n", res);
        setTimeout(() => Signin(), 2000);
    } else {
        writeCacheData("token", res['token']);
        writeCacheData("user", userRes);
        const progressBar = new ProgressBar(mainMenu);
        progressBar.run({
            width: 100,
            title: '\n\n\t\tLOADING\t\t',
            eta: true,
            percent: true,
            titleStyle: term.bold.brightRed,
            barStyle: term.brightGreen
        });
    }

}

async function Signup() {
    clear();
    await term.slowTyping(
        'Please Enter details\n\n',
        {
            flashStyle: term.brightWhite,
            delay: 80,
            style: term.brightMagenta.bold
        }
    )
    const answer = await inquirer.prompt(signupQuestion);
    const req = await postRequest(answer, "/entry/api/register");
    const res = await req.json();
    if (req.status !== 200) {
        console.log("\n", res);
        setTimeout(() => Signup(), 2000);
    } else {
        await main();
    }
}

module.exports = { Signin, Signup };