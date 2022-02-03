'use strict';

/**
 * TODO: current scene is that we can't navigate bac
 * Implement a functionality to do so
 */

// library import
const term = require('terminal-kit').terminal;
const inquirer = require('inquirer');
const clear = require('clear');
const colorette = require('colorette');
const moment = require('moment');

// module import
const { getRequest } = require('../../api/apiReq');
const auctionClient = require('./auctionClient');
const ApplicationManager = require("../applicationStack");

class AuctionMenu {
    #intervalStack;
    #serverData;
    #promptEvent;

    constructor() {
        this.#intervalStack = [];
        this.#serverData = [];
        this.#promptEvent = undefined;

        const requestInterval = setInterval(async () => {
            const data = await getRequest('/auction/list');
            if (data.status !== 200) {
                this.destroy();
                console.log(`Error: ${await data.json()}`);
                process.exit(1);
            }
            const auctionList = await data.json();

            this.#serverData = [];
            Object.keys(auctionList).forEach(indices => {
                this.#serverData.push(auctionList[indices]);
            });

        }, 5000);
        this.#intervalStack.push(requestInterval);
    }


    async renderCallback() {
        clear();
        let table = [], questionChoices = [];
        table.push(['ID', 'Name', 'Starts', 'End']);

        // deep copy for array of objects
        const localServerDataReference = JSON.parse(JSON.stringify(this.#serverData));


        localServerDataReference.forEach((doc) => {
            questionChoices.push(`${doc._id} : ${doc.name}`);
            doc.startsAt = moment(doc.startsAt).format('YYYY-MM-DD hh:mm:ss');
            doc.endsAt = moment(doc.endsAt).format('YYYY-MM-DD hh:mm:ss');
            const ar = Object.values(doc);
            ar.pop(); ar.pop();
            table.push(ar);
        });
        questionChoices.push('Back');
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
        if (!this.#promptEvent || this.#promptEvent.ui.activePrompt.status !== 'answered') {
            this.#promptEvent = inquirer.prompt({
                type: 'list',
                name: 'auctionOption',
                message: colorette.bold(colorette.red('Please select Id of the auction to enter.\n\n')),
                choices: questionChoices
            });
        }
    }

    async render() {
        const tableInterval = setInterval(async () => {
            // to avoid event Listener stacking problem clear the previous event
            if (this.#promptEvent && this.#promptEvent.ui.activePrompt.status !== 'answered')
                this.#promptEvent.ui.close();
            await this.renderCallback();
        }, 5000);

        const answerInterval = setInterval(async () => {
            if (this.#promptEvent && this.#promptEvent.ui.activePrompt.status === 'answered') {
                const answer = this.#promptEvent.ui.activePrompt.answers;
                this.#promptEvent.ui.close();
                this.destroy();
                const which = answer['auctionOption'];
                if (which === 'Back') {
                    await ApplicationManager.back();
                }
                const id = which.split(':')[0].trim();
                // TODO : add check for expiry of auction
                const auction = new auctionClient(id);
                auction.main();
            }
        }, 1000);

        this.#intervalStack.push(tableInterval, answerInterval);
    }
    async start() {
        await this.render();
    }
    destroy() {
        this.#intervalStack.forEach(interval => clearInterval(interval));
        this.#intervalStack = [];
    }
}

module.exports = AuctionMenu;
