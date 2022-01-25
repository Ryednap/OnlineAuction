'use strict';

// TODO: Force Auction stop on endTime
// TODO: Timer shouldn't be reset on consecutive bid unless timer is less than 10
// TODO: Documentation

const cron = require('node-schedule');
const EventEmitter = require('events');
const sleep = require('sleep');
const {
    auctionModel,
    auctionHistoryModel,
    transactionHistoryModel
} = require('../models/auction_model');
const { itemModel, userItemRelationModel } = require('../models/item_model');
const {parseCron} = require("../utils/utils");

const auctionEmitter = new EventEmitter();

class Auction {
    #id;
    #auctionData;
    #currentItemPosting;
    #currentBid;
    #timer;

    get auctionId () { return this.#id; }

    get currentItem () { return this.#currentItemPosting;}

    /**
     * @typedef {Object} HighestBid
     * @property {string} userId - Id of the user who bid
     * @property {string} userName - Name of the user who bid
     * @property {number} currentPrice - currentPrice the user has bid
     */
    /**
     *
     * @return {HighestBid} : current Highest bid for the item posted
     */
    get highestBid () { return this.#currentBid; }

    /**
     * @return {number}
     */
    get currentTimer () { return this.#timer; }

    /**
     * @param id {string}
     */
    constructor(id) {
        this.#id = id;
        this.#currentBid = this.#currentItemPosting = null;
        this.#timer = 30;
        // Creating an empty History schema to back up the data
        auctionHistoryModel.create({
            auctionId: this.#id
        }).then(r => console.log(r)).catch(error => console.log(error));
        try {
            this.#init();
        } catch (error) {
            throw error;
        }
    }

    async #init () {
        auctionModel.find({_id: this.#id}).then(doc => {
            if (doc.length === 0) {
                throw new Error(`Provided Auction id ${this.#id} does not match in database`);
            }
            this.#auctionData = doc[0];
            console.log('Auction Initialized');
            this.run();
        }).catch (error => {
            throw error;
        });
    }

    /**
     * [Post Transaction Process that tries to transfer the item to
     *  the highest bidder, create-backup and save transaction
     * ]
     * @return {Promise<void>}
     */
    async #postTransactionProcess () {
        try {
            const userItemRelation = await userItemRelationModel.findOneAndDelete({itemId: this.#currentItemPosting.id});
            const transaction = {
                seller: userItemRelation.userId,
                buyer: this.#currentBid.userId,
                itemId: this.#currentItemPosting._id,
                sellPrice: this.#currentBid.currentPrice,
                auctionCharge: this.#auctionData.auctionCharge
            };
            console.log(`Transaction to be created : ${transaction}`);
            const createdTransaction = await transactionHistoryModel.create(transaction);
            console.log(`Created Transaction: ${createdTransaction}`);

            const userItemObject = {
                userId: this.#currentBid.userId,
                itemId: this.#currentItemPosting.id,
                originalOwner: false
            };
            const newUserItemRelation = await userItemRelationModel.create(userItemObject);
            console.log(`Transferred item to user : ${newUserItemRelation}`);

            auctionModel.findOneAndRemove({_id: this.#id});
            auctionHistoryModel.findOneAndUpdate({auctionId: this.#id}, {
                $push: {
                    transactionId: createdTransaction._id
                }
            });

        } catch (error) {
            throw error;
        }
    }

    #timerRun () {
        console.log(this.#timer);
        this.#timer-=10;
        if (this.#timer <= 0) auctionEmitter.emit('next-item');
    }


    run () {
        const itemList = this.#auctionData.itemListing;
       // assert (moment().isAfter(this.#auctionData.startsAt) && moment().isBefore(this.#auctionData.endsAt));

        let timerJob = cron.scheduleJob('* * * * * *', () => {this.#timerRun();});
        auctionEmitter.on('bid', (userBidData) => {
            console.log(`Received Bid ${userBidData}`);
            this.#timer = 30;
            if (this.#currentBid.currentPrice > userBidData.currentPrice) {
                auctionEmitter.emit('bid-error', 'Bid Price less than current Price');
            }
            this.#currentBid = userBidData;
        });
        auctionEmitter.on('next-item', () => {
            console.log('posting next item');
            timerJob.cancel();
            this.#timer = 30;
            if (this.#currentBid) {
                this.#postTransactionProcess().then(() => console.log('Post Transaction Process Complete'))
                    .catch(err => {throw err; });
            }
            // If more item in the list
            if (itemList.length) {
                setTimeout(async () => {
                    const itemId = itemList.pop();
                    try {
                        /**
                         * returns array of documents hence take care to initialize correctly
                         * @return {Array}
                         */
                        this.#currentItemPosting = await itemModel.find({_id: itemId});
                        this.#currentItemPosting = this.#currentItemPosting[0];
                        console.log(this.#currentItemPosting);
                    } catch (error) {
                        throw error;
                    }

                    // Initially set current Bid object to dummy variable
                    this.#currentBid = {
                        userId: '-',
                        userName: '-',
                        currentPrice: this.#currentItemPosting.basePrice,
                    };
                    timerJob = cron.scheduleJob('* * * * * *', () => {this.#timerRun();});
                    auctionEmitter.emit('item-listed');
                }, 1000);
            } else {
                this.destroy();
            }
        });

        // to Fire the event once
        auctionEmitter.emit('next-item');
    }

    /**
     * Destroy the current instance of auction : remove all listeners and emit 'On-Complete' event
     * @emits 'On-complete'
     */
    destroy () {
        auctionEmitter.removeAllListeners('bid').removeAllListeners('next-event');
        auctionEmitter.emit('On-complete');
        console.log('Auction complete');
    }

}

/**
 *
 * @type {AuctionScheduler}
 *
 */
class AuctionScheduler {
    #jobList;
    #currentJobId;
    #currentAuctionObject;
    constructor() {
        this.#jobList = [];
        this.#currentJobId = undefined;
        this.#currentAuctionObject = undefined;

        auctionEmitter.on('On-complete', () => {
           this.#currentAuctionObject = undefined;
           this.#currentJobId = undefined;
        });
    }

    get jobId () { return this.#currentJobId; }
    get currentAuction () { return this.#currentAuctionObject; }

    #runAuction (id) {
        try {
            for (let i = 0; i < this.#jobList.length; ++i) {
                if (this.#jobList[i].id === id) {
                    console.log('Found');
                    this.#jobList[i].job.cancel();
                    this.#jobList.splice(i, 1);
                }
            }
            this.#currentJobId = id;
            console.log(`Running Auction ${id}`);
            this.#currentAuctionObject = new Auction(id);
            sleep.sleep(3);
        } catch (error) {
            console.log('Caught Exception in running auction');
            console.log(error);
        }
    }

    scheduleAuction (scheduleTime) {
        console.log('Scheduling Auction');
        const job = cron.scheduleJob(parseCron(scheduleTime.startsAt), () => {
            console.log('Scheduled Auction is starting');
            this.#runAuction(scheduleTime.id);
        });
        const jobObject = {
            id : scheduleTime.id,
            detail: scheduleTime,
            job: job
        };
        this.#jobList.push(jobObject);
    }

    getScheduledAuctionDetail (id) {
        console.log(`length : ${this.#jobList.length} given Id : ${id}`);
        let jobDetail = {};
        this.#jobList.forEach(job => {
            console.log(job.id);
            if (job.id.toString() === id) {
                console.log('FOUND\n');
                jobDetail = job.detail;
            }
        });
        return jobDetail;
    }
}

let auctionScheduler = new AuctionScheduler();
module.exports = {auctionScheduler, auctionEmitter};