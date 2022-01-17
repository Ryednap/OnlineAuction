const {getRequest} = require('../../api/apiReq');
const moment = require('moment');
const term = require('terminal-kit').terminal;
const clear = require('clear');
const centerAlign = require('center-align');
const colorette = require('colorette');

class Auction {
    #id;
    #auctionData;
    #intervalStack;

    constructor(id) {
        this.#id = id;
        this.#intervalStack = [];
    }
    #beforeStartCallBack () {
        const loopInterval = setInterval(() => {
            clear();
            console.log(
                centerAlign(colorette.bold(colorette.red(
                    'Please Wait for Auction to Begin\n'
                )), 90)
            );
            console.log(
                centerAlign(colorette.bold(colorette.green(
                    moment().format('yyyy-mm-dd:hh:mm:ss')
                )), 100)
            );
        }, 1000);
        this.#intervalStack.push(loopInterval);
    }
    #run () {

    }
    async start() {
        clear();
        const data = await getRequest('/auction/list/' + this.#id);
        this.#auctionData = await data.json();
        if (moment(this.#auctionData.startsAt).isBefore(moment())) {
            term.slowTyping('Please Wait for Auction to Begin', {
                flashStyle: term.brightWhite,
                style: term.magenta,
            }, () => {
                this.#beforeStartCallBack();
            });
        } else if (moment(this.#auctionData.endsAt).isBefore(moment())) {
            term.slowTyping('Sorry the event is over.. returning to auction menu', {
                flashStyle: term.brightWhite,
                style: term.magenta
            });
        } else {

        }
    }
    init (callback) {
        console.log('inside init');
        callback.bind(this);
        callback();
    }
}

let auction = new Auction('3cced460ce2a15c820d843585a82');
auction.start();

module.exports = Auction;