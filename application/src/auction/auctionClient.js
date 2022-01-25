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

            console.log(centerAlign(
                colorette.bold(colorette.magentaBright(this.state.currentItemPosting.name + '\n'))
            , 80));
            console.log(centerAlign(
                colorette.italic(colorette.greenBright(this.state.currentItemPosting.description + '\n'))
            ), 80);
            console.log(centerAlign(
                colorette.redBright('Base Price:  ') +
                colorette.greenBright(this.state.state.basePrice)
            ), 80);
            console.log(centerAlign(
                colorette.redBright('Current Price:  ') +
                colorette.greenBright((this.state.highestBid.currentPrice))
            ), 80);
            console.log(centerAlign(
                colorette.redBright('Highest Bidder   ') +
                colorette.greenBright(this.state.highestBid.userName)
            ), 80);
            console.log(centerAlign(
                colorette.bold(colorette.yellowBright(this.#serverAuctionTimer--))
            ));

            if (this.#bidPrompt && this.#bidPrompt.ui.activePrompt.status === 'answered') {
                const answer = this.#bidPrompt.ui.activePrompt.answers;
                if (answer['option'] === 'bid') {
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

        this.#intervalStack.push(runInterval);
    }

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
                colorette.yellowBright(moment(this.#auctionData.startsAt).format('YYYY-MM-DD hh:mm:ss') + '\n')
            );
        }, 1000);
        this.#intervalStack.push(waitInterval);
        this.#socket.once('update', () => {
            clearInterval(waitInterval);
        });
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
            setTimeout(this.doDummyProgress, 100 + Math.random() * 400);
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

        // listen for the item posting update
        this.#socket.on('update', (item) => {

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