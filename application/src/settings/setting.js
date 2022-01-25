'use strict';

const inquirer = require('inquirer');
const colorette = require('colorette');
const clear = require('clear');
const centerAlign = require('center-align');

const choiceList = [
    'Change User Details',
    'Conduct Auction',
    'Delete account',
    'Exit'
];

const question = {
    type: 'list',
    name: 'option',
    message: colorette.bold(colorette.redBright('Please select one Option')),
    choices: choiceList
};

module.exports = class Settings {
    #intervalStack;
    #optionPrompt;
    constructor() {
        this.#intervalStack = [];
        this.#optionPrompt = undefined;
    }
    start() {
        let count = 0;
        const interval = setInterval(() => {
            clear();
            console.log(centerAlign(
                colorette.bold(colorette.yellowBright(new Date().toLocaleString() + '\n\n')),
                90
            ));

            if (this.#optionPrompt) {
                if (this.#optionPrompt.ui.activePrompt.status === 'answered') {
                    const answer = this.#optionPrompt.ui.activePrompt.answers;
                    switch (answer['option']) {
                        case choiceList[0] :
                            console.log(`Selected option 1`);
                            break;
                        case choiceList[1] :
                            console.log(`Selected option 2`);
                            break;
                        case choiceList[2] :
                            console.log('Selected option 3');
                            break;
                        case choiceList[3] : {
                            this.destroy();
                            return;
                        }
                        default:
                            console.log('Something Went Wrong Exiting....');
                            process.exit(1);
                    }
                } else {
                    if (count % 5 === 0) {
                        this.#optionPrompt.ui.close();
                    }
                }
            }
            if (count % 5 === 0)
                this.#optionPrompt = inquirer.prompt(question);
            ++count;

        }, 1000);
        this.#intervalStack.push(interval);
    }
    destroy() {
        clearInterval(this.#intervalStack[0]);
        this.#intervalStack.pop();
    }
}
