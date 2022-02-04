'use strict';


// library import
const term = require('terminal-kit').terminal;
const inquirer = require('inquirer');
const clear = require('clear');
const colorette = require('colorette');
const moment = require('moment');
const _ = require('lodash');

// module import
const { getRequest } = require('../../api/apiReq');
const AuctionClient = require('./auctionClient');
const ApplicationManager = require("../applicationManager");

/**
 * AuctionMenu
 * @class
 * @classdesc Main auction-menu page for the application.
 * Displays all the auction to be running or scheduled in sorted manner. To reflect the
 * dynamic changes from the server we recover the data at regular interval i.e. refreshes
 * the screen after every-interval. Note that whole class logic is built inside `setInterval`.
 * @todo: current scenario doesnot allows user to hover down more and more, implement algorithm so that user's choice starts from the previous choice after refersh of the scree (use list rotation).
 *
 */
class AuctionMenu {
    /**
     * maintains stack or list of intervals which must be cleared in destructor
     * @private
     * @name #intervalStack
     * @type: {[]}
     */
    #intervalStack;
    /**
     * Stores the data retrieved from the server about the active and scheduled auction
     * @private
     * @name #serverData
     * @type: {object}
     */
    #serverData;
    /**
     * Stores the prompt UI event from inquirer. This is necessary to record the user
     * choice if user has selected in previous interval
     * @private
     * @name promptEvent
     * @type {object} inquirer prompt object
     */
    #promptEvent;

    /**
     * Constructor function
     * initializes the class variables, send request to the server to retrieve
     * the serverData asynchronously, which is repeated every 5s interval.
     * @constructor
     */
    constructor() {
        this.#intervalStack = [];
        this.#serverData = [];
        this.#promptEvent = undefined;

        /**
         * requestInterval
         * Used to send GET request to the server to retrieve auction data
         * @type {NodeJS.Timer}
         */
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

        // push the interval into intervalStack
        this.#intervalStack.push(requestInterval);
    }

    /**
     * callback function associated with render
     * @method renderCallback
     * @returns {Promise<void>}
     */
    async renderCallback() {
        clear();
        let table = [], questionChoices = []

        // deep copy for array of objects
        const localServerDataReference = JSON.parse(JSON.stringify(this.#serverData));

        localServerDataReference.forEach((doc) => {
            questionChoices.push(`${doc._id} : ${doc.name}`);
            doc.startsAt = moment(doc.startsAt).format('YYYY-MM-DD HH:mm:ss');
            doc.endsAt = moment(doc.endsAt).format('YYYY-MM-DD HH:mm:ss');
            const ar = Object.values(doc);
            ar.pop(); ar.pop();
            table.push(ar);
        });
        questionChoices.push('Back');

        table = _.sortBy(table, function(o) {
            return moment(o[2]);
        }).reverse();

        table.splice(0, 0, ['ID', 'Name', 'Starts', 'End']);


        // display table
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

        // reset promptEvent
        if (!this.#promptEvent || this.#promptEvent.ui.activePrompt.status !== 'answered') {
            this.#promptEvent = inquirer.prompt({
                type: 'list',
                name: 'auctionOption',
                message: colorette.bold(colorette.red('Please select Id of the auction to enter.\n\n')),
                choices: questionChoices
            });
        }
    }

    /**
     * Renders auction schedule-table and promptEvent at regular intervals
     * @method
     * @returns {Promise<void>}
     */
    async render() {
        /**
         * Renders auction table and close the promptEvent if it hasn't been answered yet.
         * @type {NodeJS.Timer}
         */
        const tableInterval = setInterval(async () => {
            // to avoid event Listener stacking problem clear the previous event
            if (this.#promptEvent && this.#promptEvent.ui.activePrompt.status !== 'answered')
                this.#promptEvent.ui.close();

            // call the callback
            await this.renderCallback();
        }, 5000);

        /**
         * Logic for the promptEvent where we check the result from past interval and if user
         * has answered it then we process it otherwise the prompt is automatically reset in tableInterval
         * @type {NodeJS.Timer}
         */
        const answerInterval = setInterval(async () => {
            if (this.#promptEvent && this.#promptEvent.ui.activePrompt.status === 'answered') {
                const answer = this.#promptEvent.ui.activePrompt.answers;

                // close the prompt
                this.#promptEvent.ui.close();
                // destroy the current instance or clear the intervals so that they don't
                // render again
                this.destroy();

                // choose the route
                const which = answer['auctionOption'];
                if (which === 'Back') {
                    await ApplicationManager.back();

                } else {
                    // auction id
                    const id = which.split(':')[0].trim();
                    // TODO : add check for expiry of auction
                    await ApplicationManager.forward(new AuctionClient(id), 30);
                }
            }
        }, 1000);

        this.#intervalStack.push(tableInterval, answerInterval);
    }

    /**
     * Start
     * Driver function of the class
     * @returns {Promise<void>}
     */
    async start() {
        await this.render();
    }

    /**
     * destructor for the class. Clears each and every interval from the intervalStack.
     */
    destroy() {
        this.#intervalStack.forEach(interval => clearInterval(interval));
        this.#intervalStack = [];
    }
}

module.exports = AuctionMenu;
