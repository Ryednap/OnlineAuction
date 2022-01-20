const cron = require('node-cron');
const EventEmitter = require('events');
const emitter = new EventEmitter();

module.exports = class AuctionScheduler {
    #jobList;
    constructor() {
        this.#jobList = [];
    }
    registerSchedule (schedule) {
        this.#scheduleJob(schedule, () => {
           // auction logic
        });
    }
    #scheduleJob (schedule, cb) {
        const job = cron.schedule(schedule.startsAt, cb, {
            scheduled: false
        });
        const jobObject = {
            id: schedule.id;
            startTime: schedule.startsAt,
            endTime: schedule.endsAt,
            job: job
        };
        this.#jobList.push(jobObject);
        job.start();
    }

}
