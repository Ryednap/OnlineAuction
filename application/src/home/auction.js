const {getRequest} = require('../../api/apiReq');
const term = require('terminal-kit').terminal;
const clear = require('clear');
const inquirer = require('inquirer');
const centerAlign = require('center-align');
const colorette = require('colorette');
const clientIo = require('socket.io-client');
const figlet = require("figlet");

class Auction {
    #id;
    #auctionData;
    #intervalStack;
    #socket;
    progress = 0;
    progressBar;
    #serverAuctionTimer;

    constructor(id) {
        this.#id = id;
        getRequest("/auction/list/" + id).then(r => {
            this.#auctionData = r;
        }).catch(error => {
            console.log(error);
            process.exit(1);
        });
        // TODO move token to encrypted file as cache data
        this.#socket = clientIo('http://localhost:3000/auction', {
            auth: {token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWUzZDMwNTU2ZmM5OWNmNGIxNDk3NTgiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2NDI2NTk5NjQsImV4cCI6MTY0Mjc0NjM2NH0.H8rTjEaxXTIZVhZ-T7z8d4ptOpxwjQW8g952LxVFX8A'},
            transports: ['websocket']
        });
        this.#socket.on('connect', () => {
            console.log(`Connected to the server socket_id: ${this.#socket.id}`);
            const engine = this.#socket.io.engine;
            console.log(`Current transport means : ${engine.transport.name}`);

            engine.once('upgrade', () => {
                console.log(`Transport upgrade to : ${engine.transport.name}`);
            });

            engine.on('close', (reason  ) => {
                console.log(`Connection closed Reason : ${reason}`);
            });
        });
    }

    wait () {
        clear();
        const waitInterval = setInterval(() => {
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
                colorette.yellowBright(this.#auctionData.startsAt + '\n')
            );
        }, 1000);
        this.#intervalStack.push(waitInterval);
    }

    #doDummyProgress() {
        this.progress += Math.random() / 10;
        this.progressBar.update(this.progress);
        if (this.progress >= 1) {
            setTimeout(() => {
                term('\n');this.wait();
            }, 200)
        } else {
            setTimeout(this.#doDummyProgress, 100 + Math.random() * 400);
        }
    }
    main () {
        this.#socket.emit('join-room', this.#id, async (res) => {
            if (res.status === 'OK') {
                // status ok auction is running

            } else if (res.status === 'PEND') {
                clear();
                await term.slowTyping('Wait for Auction to Begin', {
                    flashStyle: term.brightRed,
                    delay: 100,
                    style: term.brightYellow
                });

                clear();
                this.progressBar = term.progressBar({
                    width: 80,
                    title: 'Loading data.....',
                    eta: true,
                    percent: true,
                    titleStyle: term.bold.brightMagenta,
                    percentStyle: term.brightYellow
                });
                this.#doDummyProgress();

            } else {
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



async function test() {
    const waitInterval = setInterval(() => {
        clear();
        const data = figlet.textSync('Hello World', {
            font: 'Standard',
            horizontalLayout: 'fitted',
            verticalLayout: 'full',
            whitespaceBreak: true,
        });
        console.log(centerAlign(
            colorette.bold(colorette.blueBright(data + "\n\n")),
            60
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
            colorette.yellowBright(new Date().toLocaleString() + '\n')
        );
    }, 1000);
}

test();
module.exports = Auction;