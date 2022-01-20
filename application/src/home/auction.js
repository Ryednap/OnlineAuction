const {getRequest} = require('../../api/apiReq');
const moment = require('moment');
const term = require('terminal-kit').terminal;
const clear = require('clear');
const centerAlign = require('center-align');
const colorette = require('colorette');
const clientIo = require('socket.io-client');

class Auction {
    #id;
    #auctionData;
    #intervalStack;
    #socket;

    constructor(id) {
        this.#id = id;
        this.#intervalStack = [];
        console.log('Inside constructor');
        this.#socket = clientIo('http://localhost:3000/auction', {
            auth: {token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWUzZDMwNTU2ZmM5OWNmNGIxNDk3NTgiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2NDI2NTk5NjQsImV4cCI6MTY0Mjc0NjM2NH0.H8rTjEaxXTIZVhZ-T7z8d4ptOpxwjQW8g952LxVFX8A'},
            transports: ['websocket']
        });
        this.#socket.on('connect', () => {
            console.log('connected to server');
        })
        this.#socket.on('connect_error', message => console.log(message));
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
module.exports = Auction;