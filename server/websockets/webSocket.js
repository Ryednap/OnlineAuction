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

            socket.on('join-room', (id, callback) => {
                console.log('User is joining Room');
                try {
                    socket.join(id);
                    console.log(`User : ${socket.id} joined the room`);
                    console.log(`Currently running rooms : ${socket.rooms}`);
                    if (auctionScheduler.jobId() === id) {
                        // auction is Running
                        const auctionOb = auctionScheduler.currentAuction();
                        assert (auctionOb);
                        sleep.sleep(5); // wait for 5 seconds
                        callback({
                            status: 'OK',
                            state: {
                                currentItemPosting: auctionOb.currentItemPosting(),
                                timer: auctionOb.timer(),
                                highestBid: auctionOb.highestBid()
                            }
                        });

                        auctionEmitter.on('item-listed', () => {
                            this.#io.to(id).emit('update', {
                                currentItemPosting: auctionOb.currentItemPosting(),
                                timer: auctionOb.timer(),
                                highestBid: auctionOb.highestBid()
                            });
                        });

                        auctionEmitter.on('bid-error', (args) => {
                            this.#io.to(id).emit('error', args);
                        });

                        // TODO add validation for the bid data
                        this.#io.on('bid', (bidData) => {
                            auctionEmitter.emit('bid', bidData);
                            // wait for some time
                            sleep.sleep(5);
                            this.#io.to(id).emit('update', {
                                currentItemPosting: auctionOb.currentItemPosting(),
                                timer: auctionOb.timer(),
                                highestBid: auctionOb.highestBid()
                            });
                        });
                    } else {
                        // either not running or over
                        const jobDetail = auctionScheduler.getScheduledAuctionDetail(id);
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