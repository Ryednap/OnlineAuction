'use strict';

const { Server } = require('socket.io');
const { instrument} = require('@socket.io/admin-ui');
const { validateTokenWS } = require('../middleware/auth');
const { auctionScheduler, auctionEmitter } = require('../cron/auctionScheduler');
const assert = require('assert');
const sleep = require('sleep');

module.exports = class WebSocket {
    #io;
    #numClients;
    constructor(server) {
        const io = new Server(server);
        // defining namespace
        this.#io = io.of('/auction');
        this.#numClients = 0;
        instrument(io, {auth: false});
    }
    start () {
        this.#io.use((socket, next) => {
            if (socket.handshake.auth.token) {
                try {
                    socket.user = validateTokenWS(socket.handshake.auth.token);
                    next();
                } catch (err) {
                    console.log('Caught error in auth');
                    next (new Error(err.message));
                }
            } else {
                next(new Error('Unauthorized-access'));
            }
        });

        this.#io.on('connection', (socket) => {
            this.#numClients++;
            console.log(`Connected with client : ${socket.id}`);
            console.log(`Total connected clients : ${this.#numClients}`);

            // ROOM ID equivalent to AUCTION ID
            socket.on('join-room', (id, callback) => {
                try {
                    socket.join(id);
                    console.log(`User : ${socket.id} joined the room`);
                    if (auctionScheduler.jobId === id) {
                        // auction is Running
                        const auctionOb = auctionScheduler.currentAuction;
                        sleep.sleep(5); // wait for 5 seconds
                        callback({
                            status: 'OK',
                            state: {
                                currentItemPosting: auctionOb.currentItem,
                                timer: auctionOb.currentTimer,
                                highestBid: auctionOb.highestBid,
                            }
                        });
                    } else {
                        // either not running or over
                        const jobDetail = auctionScheduler.getScheduledAuctionDetail(id);
                        console.log(jobDetail);
                        // Auction is over
                        if (Object.keys(jobDetail).length === 0) {
                            callback({status: 'NOK', error: 'No auction scheduled in given room'});
                        } else {
                            // Auction is currently scheduled in future
                            callback({
                                status: 'PEND',
                                startsAt: jobDetail.startsAt
                            });
                        }
                    }

                // Emitters and Listeners
                    auctionEmitter.on('item-listed', () => {
                        const auctionOb = auctionScheduler.currentAuction;
                        this.#io.to(id).emit('update', {
                            currentItemPosting: auctionOb.currentItem,
                            timer: auctionOb.currentTimer,
                            highestBid: auctionOb.highestBid
                        });
                    });

                    auctionEmitter.on('bid-error', (args) => {
                        this.#io.to(id).emit('error', args);
                    });

                    auctionEmitter.on('On-complete', () => {
                       this.#io.to(id).emit('On-complete');
                    });

                    // TODO add validation for the bid data
                    socket.on('bid', (bidData) => {
                        console.log(`Bid recived ${bidData}`);
                        auctionEmitter.emit('bid', bidData);
                        // wait for some time
                        sleep.sleep(5);
                        const auctionOb = auctionScheduler.currentAuction;
                        this.#io.to(id).emit('update', {
                            currentItemPosting: auctionOb.currentItem,
                            timer: auctionOb.currentTimer,
                            highestBid: auctionOb.highestBid
                        });
                    });

                } catch (error) {
                    console.log(error);
                    callback({status: 'NOK', error: error.message});
                }
            });

            socket.on('leave-room', (id, callback) => {
                try {
                    socket.leave(id);
                    callback({status: 'OK'});
                } catch (error) {
                    callback({status: 'NOK', error: error});
                }
            });

            socket.on('disconnect', () => {
                this.#numClients--;
                console.log(`Client with id : ${socket.id} disconnected`);
            });
        });
    }
};
