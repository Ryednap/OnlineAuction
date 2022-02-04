'use strict';

// library import


const {getRequest} = require('../../api/apiReq');
const term = require('terminal-kit').terminal;
const clear = require('clear');
const inquirer = require('inquirer');
const centerAlign = require('center-align');
const colorette = require('colorette');
const moment = require('moment');
const clientIo = require('socket.io-client');
const figlet = require("figlet");
const Box = require('cli-box');


// module import
const {readCacheData} = require('../../utils/cache');
const logger = require('../../utils/logger');
const ApplicationManager = require("../applicationManager");

/**
 * Item object which is actually model in server
 *
 * @typedef {Object} item
 * @property {string} _id - id of the item
 * @property {string} name - name of the item
 * @property {string} description - description related to the item
 * @property {number} basePrice - basePrice of the item
 * @property {number} minSalePrice - minimum SalePrice of the item
 */

/**
 *
 * HighestBid object with the user details who has bid and the current bid price
 * @typedef {Object} HighestBid
 * @property {string} userId - Id of the user who bid
 * @property {string} userName - Name of the user who bid
 * @property {number} currentPrice - currentPrice the user has bid
 */

/**
 *
 * Current state of the auction recived from server processed in the client
 * @typedef {Object} state
 * @property {item} currentItemPosting - current Item in the context
 * @property {number} timer - current timer
 * @property {HighestBid} highestBid - HighestBid object
 */

/**
 * AuctionClient handles client-side communication with server using websocket. This class
 * is responsible for conducting single auction at a time whose id must be provided to the
 * constructor
 * @name AuctionClient
 * @class
 * @classdesc client side auction protocol for providing buyers and interface to bid
 */
class AuctionClient {
    /**
     * @name #id
     * @private
     * @type {string}
     * @desc Id of the auction to be run
     */
    #id;

    /**
     * userInfo is client representation of database model
     * of same name implemented in backend. Used to carry user information
     * across network
     *
     * @name #userInfo
     * @type {Object}
     * @property {string} id - Id of the user
     * @property {string} userName - name of the uer
     * @property {string} email - email of the user
     * @property {string} password - password of the user
     * @property {string} role - role associated with the user
     * @property {Date} accountCreationDate: creation date of the account
     */
    #userInfo;

    /**
     * Auction data models the backend database of the same name in client side
     * @name #auctionData
     * @type {Object}
     * @property {string} id - Id of the auction
     * @property {string} name - Name of the auction
     * @property {Date} startsAt - auction Start time
     * @property {Date} endsAt - auction End time
     * @property {number} auctionCharge - fees charged by auction manager per item transacted
     * @property {[]} itemListing - list of items listed for auction
     */
    #auctionData;

    /**
     * maintains stack of Nodejs Interval which has to destroyed in destructor
     * @name #intervalStack
     * @type {[]}
     */
    #intervalStack;

    /**
     * Client-side socket connection
     * @name #socket
     * @type {clientIo}
     */
    #socket;

    /**
     * Timer received from server
     * @name #serverAuctionTimer
     * @type {number}
     */
    #serverAuctionTimer;


    /**
     * Bidding Prompt for user
     * @name #bidPrompt
     * @type: {object]}
     */
    #bidPrompt;

    /**
     * process counter (UI feature not a core feature)
     * @name progress
     * @type {number}
     */
    progress = 0;

    /**
     * terminal-kit progressBar (UI feature not a core feature)
     * @name progressBar
     * @type {object}
     */
    progressBar;

    /**
     * state of the current auction
     * @name state
     * @type {state}
     */
    state;

    /**
     * status received from socket-server
     * @name auctionStatus
     * @type {string}
     */
    auctionStatus;

    /**
     * Does the initialization task associated with getting request, setting up socket connection
     * initializing variables
     * @constructor
     * @param id {string}
     * @description Constructor function of the class
     */
    constructor(id) {

        // variable initialization
        this.#id = id;
        this.#intervalStack = [];
        this.#userInfo = readCacheData("user");
        this.doDummyProgress = this.doDummyProgress.bind(this);

        // HTTP requests for getting server data
        getRequest("/auction/list/" + id).then(async r => {
            r = await r.json();
            logger.debug.debug('GET /auction/list\t' + JSON.stringify(r));
            this.#auctionData = r;
        }).catch(error => {
            logger.error.error('GET /auction/list/' + id + '\tLine:34 auctionClient.js\t' + error.message);
            process.exit(1);
        });

        // socket programming starts
        this.#socket = clientIo('http://localhost:3000/auction', {
            auth: {token: readCacheData("token")},
            transports: ['websocket']
        });
        this.#socket.on('connect', () => {
            logger.info.info('WebSocket\t' + `Connected to the server socket_id: ${this.#socket.id} for auction_id : ${id}`);
            const engine = this.#socket.io.engine;
            logger.info.info(`Current transport means : ${engine.transport.name}`);

            engine.once('upgrade', () => {
                logger.info.info(`Transport upgrade to : ${engine.transport.name}`);
            });

            engine.on('close', (reason  ) => {
                logger.info.info(`Connection closed Reason : ${reason}`);
            });
        });
    }


    /**
     * Generates Auction RunTime text about product put up on display
     * @method
     * @name #generateText
     * @returns {string}
     */
    #generateText () {
        return `${colorette.bold(colorette.blueBright(this.state.currentItemPosting.name + '\n'))}
        ${colorette.italic(colorette.magentaBright(this.state.currentItemPosting.description + '\n'))}
        ▸ ${colorette.redBright('Base Price:  ') + colorette.greenBright(this.state.currentItemPosting.basePrice)}
        ▸ ${colorette.redBright('Current Price:  ') + colorette.greenBright((this.state.highestBid.currentPrice))}
        ▸ ${colorette.redBright('Highest Bidder   ') + colorette.greenBright(this.state.highestBid.userName ? this.state.highestBid.userName : '-' + '\n')}
        ${colorette.bold(colorette.yellowBright(this.#serverAuctionTimer--))}`;
    }


    /**
     * This method runs the auction if the server status shows running.
     * The method listens and fires events to and from socket-server
     * @method
     * @name run
     * @listens update state update from the server each second
     * @listens On-complete completion state change
     * @fires bid
     *
     */
    run () {
        clear();
        // initialize the timer currently on server
        this.#serverAuctionTimer = this.auctionStatus.timer;

        /**
         * @name runInterval
         * @type {NodeJS.Timer}
         * @async
         * @description Runs the main logic of the method where we display the current auction state and timer
         */
        const runInterval = setInterval (async () => {
            clear();
            const data = figlet.textSync(this.#auctionData.name, {
                font: 'Standard',
                horizontalLayout: 'fitted',
                verticalLayout: 'full',
                whitespaceBreak: true,
            });
            console.log(centerAlign(
                colorette.bold(colorette.blueBright(data + "\n\n")),
                80
            ));

            logger.debug.debug(JSON.stringify(this.state));
            logger.debug.debug(JSON.stringify(this.state.currentItemPosting));

            /**
             * Generate box around the string data received from #generateText
             * @name myBox
             * @type {*|CliBox}
             */
            const myBox = new Box({
                w: 50,
                h: 10,
                stringify: false,
                marks: {
                    nw: '╭',
                    n: '─',
                    ne: '╮',
                    e: '│',
                    se: '╯',
                    s: '─',
                    sw: '╰',
                    w: '│'
                },
                hAlign: 'middle',
                vAlign: 'middle'
            }, this.#generateText());

            console.log(myBox.stringify());

            // Check if user has bid or not otherwise reset the bidPrompt
            if (this.#bidPrompt && this.#bidPrompt.ui.activePrompt.status === 'answered') {
                const answer = this.#bidPrompt.ui.activePrompt.answers;
                if (answer['option'] === 'bid') {
                    logger.info.info('Emitting Bid data to the server');


                    /**
                     * Current user Data
                     * @typedef {Object} userData
                     * @property {string} userId - Id of the user
                     * @property {string} userName - name of the user
                     * @property {number} currentPrice - currentHighestBid + 50
                     */
                    /**
                     * Emit the bid event to the server along with {userData}
                     * @event bid
                     */
                    this.#socket.emit('bid', {
                        userId: this.#userInfo._id,
                        userName: this.#userInfo.userName,
                        currentPrice: this.state.highestBid.currentPrice + 50.0
                    });

                } else {
                    this.destroy();
                    await ApplicationManager.back();
                }
            }

            // if the user hasn't responded and prompt has been defined then close it
            if (this.#bidPrompt) this.#bidPrompt.ui.close();
            // redefine the bidPrompt
            this.#bidPrompt= inquirer.prompt({type: 'list', name: 'option', message: ' ', choices: ['bid', 'quit']});
        }, 1000);


        /**
         * Listener to listen the update event from socket-server
         * @listens update
         */
        this.#socket.on('update',
            /**
             * @param state {state}
             */
            (state) => {
            this.#serverAuctionTimer = state.timer;
            this.state = state;
        });


        /**
         * listens for the on-completion event from the server only once
         * @listens On-complete
         */
        this.#socket.once('On-complete',
            /**
             * Performs completion function
             * @async
             * @returns {Promise<void>}
             */
            async () => {
            await this.onComplete();
        });

        this.#intervalStack.push(runInterval);
    }

    /**
     * Wait function: called when we are still waiting for the auction to begin. The code resides
     * in setInterval function which is necessary to notify the user about current time which should
     * be updated each and every second.
     *
     * Function also listens to the Server-event "update" to decide if it's time to change the state
     * of auction
     * @function
     * @listens update
     */
    wait () {
        clear();
        let quitPrompt = undefined;
        const waitInterval = setInterval(async () => {
            clear();
            logger.debug.debug(`Auction data at the wait run: ${JSON.stringify(this.#auctionData)}`);
            logger.debug.debug(`this at callback of wait: ${JSON.stringify(this)}`)
            const data = figlet.textSync(this.#auctionData.name, {
                font: 'Standard',
                horizontalLayout: 'fitted',
                verticalLayout: 'full',
                whitespaceBreak: true,
            });
            console.log(centerAlign(
                colorette.bold(colorette.blueBright(data + "\n\n")),
                80
            ));
            process.stdout.write(
                colorette.bold(colorette.magentaBright('\tCurrent Time\t\t\t'))
            );
            process.stdout.write(
                colorette.bold(colorette.magentaBright('Scheduled Time\n\n'))
            );
            process.stdout.write(
                colorette.yellowBright('\t' + new Date().toLocaleString() + '\t\t')
            );
            process.stdout.write(
                colorette.yellowBright(moment(this.#auctionData.startsAt).format('YYYY-MM-DD HH:mm:ss') + '\n')
            );
            // quitPrompt logic
            if (quitPrompt) {
                if (quitPrompt.ui.activePrompt.status === 'answered') {
                    await ApplicationManager.back();
                } else {
                    quitPrompt.ui.close();
                    quitPrompt = inquirer.prompt({type: 'list', name: 'option', message: '\n', choices: ['quit']});
                }
            } else {
                quitPrompt = inquirer.prompt({type: 'list', name: 'option', message: '\n', choices: ['quit']});
            }
        }, 1000);
        this.#intervalStack.push(waitInterval);

        // Currently, when we are waiting and receive update from server
        // then this action is performed exactly once
        // remove the current interval and start the run Event.
        this.#socket.once('update', (state) => {
            clearInterval(waitInterval);
            this.#serverAuctionTimer = state.timer;
            this.state = state;
            this.run();
        });
    }

    /**
     * onComplete
     *
     * Rendered when the server sends "NOK" status i.e. when the auction is finished
     * @method
     * @returns {Promise<void>}
     */
    async onComplete() {
        clear();
        await term.slowTyping('Sorry The auction has ended !!!', {
            flashStyle: term.brightWhite,
            delay: 100,
            style: term.brightRed
        });
        let quitPrompt = undefined;

        const timerInterval = setInterval (async () => {
            clear();
            // message
            console.log(
                centerAlign(
                    colorette.bold(colorette.italic(colorette.magenta(
                        'Sorry The auction has ended !!!'
                    ))), process.stdout.columns / 2.0 + 10
                )
            )
            // time and date
            console.log(
                centerAlign(
                    colorette.bold(colorette.greenBright(new Date().toLocaleString()))
                    , process.stdout.columns / 2.0
                )
            );

            // quitPrompt logic
            if (quitPrompt) {
                if (quitPrompt.ui.activePrompt.status === 'answered') {
                    await ApplicationManager.back();
                } else {
                    quitPrompt.ui.close();
                    quitPrompt = inquirer.prompt({type: 'list', name: 'option', message: '\n', choices: ['quit']});
                }
            } else {
                quitPrompt = inquirer.prompt({type: 'list', name: 'option', message: '\n', choices: ['quit']});
            }
        }, 1000);
        this.#intervalStack.push(timerInterval);
    }


    /**
     * Dummy progressBar update function;  In the end based on the auctionStatus renders the
     * wait or run function.
     */
    doDummyProgress() {
        this.progress += Math.random() / 10;
        this.progressBar.update(this.progress);
        if (this.progress >= 1) {
            setTimeout(() => {
                term('\n');
                this.auctionStatus === 'PEND' ? this.wait() : this.run();
            }, 200)
        } else {
            setTimeout(this.doDummyProgress, 100 + Math.random() * 100);
        }
    }


    /**
     * Start
     *
     * Driver function of the class. Send socket event about joining the room and then based on
     * the response from Server-socket proceeds further
     * @method
     */
    start () {
        this.#socket.emit('join-room', this.#id, async (res) => {
            /**
             * response status code
             * @type: {number}
             */
            this.auctionStatus = res.status;

            /**
             * Current state of the auction on server side. Used to synchronize the server and client
             * @type: {object}
             */
            this.state = res.state;

            logger.debug.debug(`Received res from websocket: ${JSON.stringify(res)}`);
            logger.debug.debug(`Current Auction state received: ${this.state}`);


            if (this.auctionStatus === 'NOK') {
                // status NOK auction has ended
                await this.onComplete();
            } else {
                clear();
                this.progressBar = term.progressBar({
                    width: 80,
                    title: 'Indexing Auction.....',
                    eta: true,
                    percent: true,
                    titleStyle: term.bold.brightMagenta,
                    percentStyle: term.brightYellow
                });
                this.doDummyProgress();
            }
        });

    }

    /**
     * Destructor function for the class
     */
    destroy () {
        this.#intervalStack.forEach((interval) => {
           clearInterval(interval);
        });
        this.#intervalStack = [];
    }

}


module.exports = AuctionClient;
