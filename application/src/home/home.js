const term = require('terminal-kit').terminal;
const inquirer = require('inquirer');
const clear = require('clear');
const colorette = require('colorette');
const { getRequest } = require('../../api/apiReq');
const main = require('../main');
const Auction = require('./auction');

class Home {
    #intervalStack;
    #serverData;
    #mutex;
    #promptEvent;

    constructor() {
        this.#intervalStack = [];
        this.#serverData = [];
        this.#mutex = false;
        this.#promptEvent = undefined;

        const requestInterval = setInterval(async () => {
            const data = await getRequest('/auction/list');
            if (data.status !== 200) {
                this.destroy();
                process.exit(1);
            }
            const auctionList = await data.json();

            // wait for mutex to free
            while (this.#mutex) {}
            // acquire the mutex lock
            this.#mutex = true;
            this.#serverData = [];
            Object.keys(auctionList).forEach(indices => {
                this.#serverData.push(auctionList[indices]);
            });
            // release the lock
            this.#mutex = false;
        }, 5000);
        this.#intervalStack.push(requestInterval);
    }


    async renderCallback() {
        clear();
        let table = [], questionChoices = [];
        table.push(['ID', 'Name', 'Starts', 'End']);
        while (this.#mutex) {}
        this.#mutex = true;
        // deep copy for array of objects
        const localServerDataReference = JSON.parse(JSON.stringify(this.#serverData));
        this.#mutex = false;

        localServerDataReference.forEach((doc) => {
            questionChoices.push(`${doc._id} : ${doc.name}`);
            table.push(Object.values(doc));
        });
        questionChoices.push('Exit');

        await term.table(table, {
            hasBorder: true,
            contentHasMarkup: true,
            fit: true,
            width: 120,
            borderChars: 'dotted',
            borderAttr: { color: 'yellow' },
            firstRowTextAttr: { color: 'red' },
            firstColumnTextAttr: { color: 'magenta' },
        });

        // todo: ERROR HERE FIND A WAY TO CLOSE THIS EVENT IF ANSWER IS NOT REACHED
        this.#promptEvent = inquirer.prompt({
            type: 'list',
            name: 'auctionOption',
            message: colorette.bold(colorette.red('Please select Id of the auction to enter.\n\n')),
            choices: questionChoices
        }).then((answer) => {
            const which = answer['auctionOption'];
            console.log(answer, which);
            if (which === 'Exit') {
                this.destroy();
                main();
            }
            const id = which.split(':')[0].trim();
            // TODO : add check for expiry of auction
            this.destroy();
            const auction = new Auction(id);
            auction.start();
        }).catch((error) => {
            console.log(error);
        });
    }

    async render() {
        const tableInterval = setInterval(async () => {
            // to avoid event Listener stacking problem clear the previous event
            if (this.#promptEvent) this.#promptEvent.ui.close();
            await this.renderCallback();
        }, 15000);

        this.#intervalStack.push(tableInterval);
    }
    start() {
        this.render();
    }
    destroy() {
        this.#intervalStack.forEach(interval => clearInterval(interval));
        this.#intervalStack = [];
    }
}

const ob = new Home();
ob.start();