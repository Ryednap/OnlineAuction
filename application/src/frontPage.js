'use strict';

const inquirer = require('inquirer');
const colorette = require('colorette');
const figlet = require('figlet');
const centerAlign = require('center-align');
const clear = require('clear');


const question = [
    {
        type: 'list',
        name: 'option',
        message: colorette.whiteBright('Please Select option\n'),
        choices: ['Signin', 'Signup', 'Exit']
    }
]

async function frontPageDrawer() {
    try {
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

        return await inquirer.prompt(question);

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = frontPageDrawer