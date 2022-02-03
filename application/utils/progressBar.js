'use strict';

const EventEmitter = require('events');
const {terminal: term} = require("terminal-kit");
const sleep = require('sleep');
const assert = require('assert');

module.exports = class ProgressBar extends EventEmitter{
    #object;
    #progress;
    #progressBar
    #args;
    #delay
    constructor(object, args, delay) {
        super();
        this.#object = object;
        this.#args = args;
        this.#delay = delay;
        this.#progress = 0;
        this.doProgress = this.doProgress.bind(this);

    }

    doProgress () {
        this.#progress += Math.random() / 10;
        this.#progressBar.update(this.#progress);
        if (this.#progress >= 1) {
            setTimeout(async () => {
                sleep.sleep(1);
                if (this.#object) {
                    const returnValue = await this.#object.start(...this.#args);
                    this.emit('return', returnValue);
                }
            }, 1000);
        } else {
            setTimeout(this.doProgress, 50 + Math.random() * this.#delay);
        }
    }

    run (progressStyle) {
        this.#progressBar = term.progressBar(progressStyle);
        return this.doProgress();
    }
}
