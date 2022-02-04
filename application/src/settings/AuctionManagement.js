'use strict';

// Todo: need testing

const {readCacheData} = require("../../utils/cache");
const {terimal: term} = require('terminal-kit');
const colorette = require('colorette');
const inquirer = require('inquirer');
const sleep = require('sleep');
const centerAlign = require('center-align');
const {postRequest, getRequest, patchRequest, deleteRequest} = require("../../api/apiReq");
const ApplicationManager = require("../applicationManager");
const {clear} = require("clear");


const createQuestion = [
    {
        type: 'input',
        name: "name",
        message: colorette.bold(colorette.blueBright("\n\nname"))
    },
    {
        type: 'input',
        name: "startsAt",
        message: colorette.bold(colorette.blueBright("Starting Time"))
    },
    {
        type: 'input',
        name: "endsAt",
        message: colorette.bold(colorette.blueBright("Ending Time"))
    },
    {
        type: 'input',
        name: "charge",
        message: colorette.bold(colorette.blueBright("Auction Charge"))
    },
];

const promptQuestion = {
    type: 'list',
    name: 'choice',
    message: colorette.bold(colorette.yellowBright("\nPlease Make a choice\n")),
    choices: ['Modify', 'Create', 'Delete', 'Go Back']
}

module.exports = class AuctionManagement {

    async prompt() {
        clear();
        const answer = inquirer.prompt(promptQuestion);
        switch(answer['choice']) {
            case 'Modify' : await this.#modify(); break;
            case 'Create' : await this.#create(); break;
            case 'Delete' : await this.#delete(); break;
            case 'Go Back' : await ApplicationManager.back(); break;
            default: throw new Error("Unknown entered option AuctionManagement.js");
        }
    }

    async #create () {
        clear();
        const answer = await inquirer.prompt(createQuestion);
        const r = await postRequest(answer, "/auction/api/add");
        const res = await r.json();
        if (res.status !== 200) {
            console.log(res);
            sleep.sleep(2);
            await this.prompt();

        } else {
            console.log(centerAlign(
                colorette.italic(colorette.greenBright(`Auction Created Successfully
                Please Take note of the Id if you wish to modify later
                id: ${res.id}`))
            ), 80);
        }
    }

    /**
     *
     * @returns {Promise<string>}
     */
    static async #displayData() {
        clear();
        const auctionData = await getRequest('/auction/list');
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'choose',
            choices: auctionData.map(auction => {
                return `id: ${auction._id} ${auction.name}`;
            }).push('Back')
        });
        return answer['choose'];
    }

    async #modify () {
        let localRecurse = async () => {
            const answer = await AuctionManagement.#displayData();
            if (answer === 'Back') {
                await this.prompt();
                return;
            } else {
                const id = answer['choose'].split(' ')[0].split(' ')[1];
                const details = await inquirer.prompt(createQuestion);
                const r = await patchRequest(`api/update/${id}`, details);
                const res = await r.json();
                if (res.status !== 200) {
                    console.log(res);
                    sleep.sleep(200);
                } else {
                    console.log('Details updated successfully');
                }
            }
            queueMicrotask(async () => {
                await localRecurse();
            });
        }
        localRecurse = localRecurse.bind(this);
        await localRecurse();
    }

    async #delete () {
        let localRecurse = async () => {
            const answer = await AuctionManagement.#displayData();
            if (answer === 'Back') {
                await this.prompt();
                return;
            } else {
                const id = answer['choose'].split(' ')[0].split(' ')[1];
                const r = await deleteRequest(`api/delete/${id}`);
                const res = await r.json();
                if (res.status !== 200) {
                    console.log(res);
                    sleep.sleep(200);
                }
                queueMicrotask(async () => {
                    await localRecurse();
                });
            }
            queueMicrotask(async () => {
                await localRecurse();
            });
        }
        localRecurse = localRecurse.bind(this);
        await localRecurse();
    }

    async start() {
        await this.prompt();
    }
    destroy () {}

    toString () {
        return `AuctionManagement class`;
    }
}
