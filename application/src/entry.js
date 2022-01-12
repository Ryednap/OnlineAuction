'use-strict';

const inquirer = require('inquirer');
const colorette = require('colorette');
const clear = require('clear');
const http = require('http');
const fs = require('fs');

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
    console.log(
        colorette.greenBright('Please Enter your credentials\n')
    );
    const answer = await inquirer.prompt(siginQuestion);

    // create data to be posted to the server
    const postData = JSON.stringify(answer);
    const requestOption = {
        host: 'localhost',
        port: 3000,
        path: '/entry/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };


    // create HTTP request to the server
    const req = http.request(requestOption, (res) => {
        console.log(`Status : ${res.statusCode}`);

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(chunk);
        });
    });
    req.on('error', (err) => {
        console.log(err);
    });
    req.write(postData);
    req.end();
    console.log(answer);
}

async function Signup() {
    clear();
}

module.exports = { Signin, Signup };