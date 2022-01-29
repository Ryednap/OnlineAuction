'use strict';

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

const {readCacheData} = require('../../utils/cache');
const logger = require('../../utils/logger');

class AuctionClient {
    #id;
    #userInfo;
    #auctionData;
    #intervalStack;
    #socket;
    #serverAuctionTimer;
    #bidPrompt;

    progress = 0;
    progressBar;
    state;
    auctionStatus;

    constructor(id) {
        this.#id = id;
        this.#intervalStack = [];
        this.#userInfo = readCacheData("user");
        this.doDummyProgress = this.doDummyProgress.bind(this);

        getRequest("/auction/list/" + id).then(async r => {
            r = await r.json();
            logger.debug.debug('GET /auction/list\t' + JSON.stringify(r));
            this.#auctionData = r;
        }).catch(error => {
            logger.error.error('GET /auction/list/' + id + '\tLine:34 auctionClient.js\t' + error.message);
            process.exit(1);
        });
        // TODO move token to encrypted file as cache data
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


    run () {
        clear();
        this.#serverAuctionTimer = this.auctionStatus.timer;
        const runInterval = setInterval (() => {
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

            if (this.#bidPrompt && this.#bidPrompt.ui.activePrompt.status === 'answered') {
                const answer = this.#bidPrompt.ui.activePrompt.answers;
                if (answer['option'] === 'bid') {
                    logger.info.info('Emitting Bid data to the server');
                    this.#socket.emit('bid', {
                        userId: this.#userInfo._id,
                        userName: this.#userInfo.userName,
                        currentPrice: this.state.highestBid.currentPrice + 50.0
                    });

                } else {
                    this.#destroy();
                    // TODO go back instead of process close
                    process.exit(1);
                }
            }
            if (this.#bidPrompt) this.#bidPrompt.ui.close();
            this.#bidPrompt= inquirer.prompt({type: 'list', name: 'option', message: ' ', choices: ['bid', 'quit']});
        }, 1000);

        this.#socket.on('update', (state) => {
            this.#serverAuctionTimer = state.timer;
            this.state = state;
        });

        this.#socket.on('On-complete', async () => {
            await this.onComplete();
        });

        this.#intervalStack.push(runInterval);
    }
// TODO: redundant code
    wait () {
        clear();
        const waitInterval = setInterval(() => {
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

    async onComplete() {
        clear();
        await term.slowTyping('Sorry The auction has ended !!!', {
            flashStyle: term.brightWhite,
            delay: 100,
            style: term.brightRed
        });
        let quitPrompt = undefined;
        const timerInterval = setInterval (() => {
            clear();
            console.log(
                centerAlign(
                    colorette.bold(colorette.italic(colorette.magenta(
                        'Sorry The auction has ended !!!'
                    ))), process.stdout.columns / 2.0 + 10
                )
            )
            console.log(
                centerAlign(
                    colorette.bold(colorette.greenBright(new Date().toLocaleString()))
                    , process.stdout.columns / 2.0
                )
            );
            if (quitPrompt && quitPrompt.ui.activePrompt.status === 'answered') {
                this.#destroy();
            } else if (quitPrompt) quitPrompt.ui.close();
            if (!quitPrompt || quitPrompt.ui.activePrompt.status !== 'answered')
                quitPrompt = inquirer.prompt({type: 'list', name: 'option', message: '\n', choices: ['quit']});

        }, 1000);
        this.#intervalStack.push(timerInterval);
    }

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
    main () {
        this.#socket.emit('join-room', this.#id, async (res) => {
            this.auctionStatus = res.status;
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
                    title: 'Loading data.....',
                    eta: true,
                    percent: true,
                    titleStyle: term.bold.brightMagenta,
                    percentStyle: term.brightYellow
                });
                this.doDummyProgress();
            }
        });

    }
    #destroy () {
        this.#intervalStack.forEach((interval) => {
           clearInterval(interval);
        });
        this.#intervalStack = [];
    }
}


module.exports = AuctionClient;
