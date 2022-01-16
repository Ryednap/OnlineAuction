const term = require('terminal-kit').terminal;
const inquirer = require('inquirer');
const clear = require('clear');
const colorette = require('colorette');
const centerAlign = require('center-align');
const { getRequest } = require('../../api/apiReq');
const sleep = require('sleep');


class Auction {
    #intervalStack;
    constructor() {
        this.#intervalStack = [];
    }

    render() {
        const interval = setInterval(async () => {
            clear();
            const data = await getRequest('/auction/list');
            if (data.status != 200) {
                process.exit(1);
            }
            const auctionList = await data.json();
            let table = new Array();

            table.push(['ID', 'Name', 'Starts', 'End']);
            Object.keys(auctionList).forEach((indices) => {
                let arr = new Array();
                Object.values(auctionList[indices]).forEach((data) => {
                    arr.push(data);
                });
                arr.pop(); arr.pop();
                table.push(arr);
            });

            term.table(table, {
                hasBorder: true,
                contentHasMarkup: true,
                fit: true,
                width: 120,
                borderChars: 'dotted',
                borderAttr: { color: 'yellow' },
                firstRowTextAttr: { color: 'red' },
                firstColumnTextAttr: { color: 'magenta' },
            });
        }, 15000);
        this.#intervalStack.push(interval);
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