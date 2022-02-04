'use strict';

const {terminal: term} = require("terminal-kit");
const sleep = require('sleep');
const assert = require('assert');

module.exports = class ProgressBar{
    #object;
    #progress;
    #progressBar
    #args;
    #delay
    constructor(object, args, delay) {
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
                    await this.#object.start(...this.#args);
                }
            }, 1000);
        } else {
            setTimeout(this.doProgress, 50 + Math.random() * this.#delay);
        }
    }

    run (progressStyle) {
        this.#progressBar = term.progressBar(progressStyle);
        this.doProgress();
    }
}
