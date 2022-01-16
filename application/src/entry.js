const fs = require('fs');
const path = require('path');
const sleep = require('sleep');
const inquirer = require('inquirer');
const term = require('terminal-kit').terminal;
const clear = require('clear');
const { postRequest } = require('../api/apiReq');
const main = require('./main');

const siginQuestion = [
    {
        type: 'input',
        name: 'userName'
    },
    {
        type: 'input',
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
        type: 'input',
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
    const answer = await inquirer.prompt(siginQuestion);
    const req = await postRequest(answer, "/entry/api/login");
    const res = await req.json();
    if (req.status !== 200) {
        console.log("\n", res);
        setTimeout(() => Signin(), 2000);
    } else {
        console.log(res['token']);
        const filePath = path.resolve(process.cwd(), "data", "secret.bin");
        const bufferData = Buffer.from(res['token'], 'utf-8');
        fs.writeFile(filePath, bufferData, async (err) => {
            if (err) console.log(`Error saving file: ${err}`);
            sleep.sleep(2);
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
        console.log(res);
        await main();
    }
}

module.exports = { Signin, Signup };