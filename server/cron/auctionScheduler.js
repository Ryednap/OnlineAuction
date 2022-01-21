'use strict';

const cron = require('node-cron');
const EventEmitter = require('events');
const moment = require('moment');
const sleep = require('sleep');
const assert = require('assert');
const {
    auctionModel,
    auctionHistoryModel,
    transactionHistoryModel
} = require('../models/auction_model');
const { itemModel, userItemRelationModel } = require('../models/item_model');

const emitter = new EventEmitter();

class Auction {
    #id;
    #auctionData;
    #currentItemPosting;
    #currentBid;
    #timer;

    constructor(id) {
        this.#id = id;
        this.#currentBid = this.#currentItemPosting = null;
        this.#timer = 30;
        auctionModel.find({_id: this.#id}).then(doc => {
            this.#auctionData = doc;
        }).catch (error => {
            throw error;
        });
        auctionHistoryModel.create({
            auctionId: this.#id
        }).then(r => console.log(r)).catch(error => console.log(error));
    }

    async #postTransactionProcess () {
        try {
            const userItemRelation = await userItemRelationModel.findOneAndDelete({itemId: this.#currentItemPosting.id});
            const transaction = {
                seller: userItemRelation.userId,
                buyer: this.#currentBid.userId,
                sellPrice: this.#currentBid.currentPrice,
                auctionCharge: this.#auctionData.auctionCharge
            };
            console.log(`Transaction: ${transaction}`);
            const createdTransaction = await transactionHistoryModel.create(transaction);
            console.log(`Created Transaction: ${createdTransaction}`);
            const userItemObject = {
                userId: this.#currentBid.userId,
                itemId: this.#currentItemPosting.id,
                originalOwner: false
            };
            const newUserItemRelation = await userItemRelationModel.create(userItemObject);
            console.log(`Transferred item to user : ${newUserItemRelation}`);

            auctionHistoryModel.findOneAndUpdate({auctionId: this.#id}, {
                $push: {
                    transactionId: createdTransaction._id
                }
            });

        } catch (error) {
            throw error;
        }
    }

    run () {
        const itemList = this.#auctionData.itemListing;
        assert (moment().isAfter(this.#auctionData.startsAt) && moment().isBefore(this.#auctionData.endsAt));

        const timerJob = cron.schedule('1 * * * * *', () => {
            this.#timer--;
            if (this.#timer <= 0) emitter.emit('next-item');
        }, {
            scheduled: false
        });
        emitter.on('bid', (userBidData) => {
            this.#timer = 30;
            this.#currentBid = userBidData;
        });
        emitter.on('next-event', () => {
            timerJob.stop();
            this.#timer = 30;
            this.#postTransactionProcess();
            if (itemList.length) {
                setTimeout(async () => {
                    const itemId = itemList.pop();
                    try {
                        this.#currentItemPosting = await itemModel.find({_id: itemId});
                        console.log(this.#currentItemPosting);
                    } catch (error) {
                        throw error;
                    }
                    this.#currentBid = {
                        userId: '-',
                        userName: '-',
                        currentPrice: this.#currentItemPosting.basePrice,
                    };
                    timerJob.start();
                    emitter.emit('item-listed');
                }, 1000);
            } else {
                this.destroy();
            }
        });
    }
    destroy () {
        emitter.removeAllListeners('bid').removeAllListeners('next-event');
        emitter.emit('On-complete');
    }
}

module.exports = class AuctionScheduler {
    #jobList;
    #currentJob;
    constructor() {
        this.#jobList = [];
        this.#currentJob = undefined;
        emitter.on('On-complete', () => {
            if (!this.#currentJob) throw new Error(`required: cron Job\nReceived: ${typeof this.#currentJob}`);
            const index = this.#jobList.findIndex(this.#currentJob);
            assert (index !== -1);
            this.#jobList[index].stop();
            this.#jobList.splice(index, 1);
        });
    }

    #runAuction (id) {
        try {
            const auction = new Auction(this.#currentJob.id);
            sleep.sleep(3);
            auction.run();
        } catch (error) {
            console.log('Caught Exception in running auction');
            console.log(error);
        }
    }

    scheduleAuction (scheduleTime) {
        const job = cron.schedule(scheduleTime.startsAt, () => {
            this.#runAuction(scheduleTime.id);
        }, {scheduled: false});
        const jobObject = {
            id : scheduleTime.id,
            job: job
        };
        this.#jobList.push(jobObject);
    }
}
