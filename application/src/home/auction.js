const term = require('terminal-kit').terminal;
const inquirer = require('inquirer');
const clear = require('clear');
const colorette = require('colorette');
const centerAlign = require('center-align');
const sleep = require('sleep');


class Auction {
    #timeFeed;
    #intervalStack;
    #flag;
    constructor() {
        this.#intervalStack = [];
        this.#flag = false;
    }
    updateTime() {
        const datetime = new Date();
        this.#timeFeed = `${datetime.toISOString().slice(0, 10)} ${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}`;
    }

    clearLastLine = () => {
        process.stdout.moveCursor(0, -2) // up one line
        process.stdout.clearLine(1) // from cursor to end
    }
    async render() {
        clear();
        const queryInterval = setInterval(async () => {
            this.clearLastLine();
            this.updateTime();
            console.log(this.#timeFeed);;
        }, 1000);
        setTimeout(() => {
            inquirer.prompt({
                type: 'list',
                name: 'hello',
                choices: ['a', 'b'],
            });
        }, 1000);

        this.#intervalStack.push(queryInterval);
    }
    main() {
        this.render();
    }
    destroy() {
        this.#intervalStack.forEach(interval => clearInterval(interval));
        this.#intervalStack = [];
    }
}

const ob = new Auction();
ob.main();