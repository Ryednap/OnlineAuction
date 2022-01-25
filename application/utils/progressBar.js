'use strict';

const {terminal: term} = require("terminal-kit");
const sleep = require('sleep');
const assert = require('assert');

module.exports = class ProgressBar {
    #callback;
    #progress;
    #progressBar;
    returnValue;
    constructor(callback) {
        this.#callback = callback;
        this.#progress = 0;
        this.doProgress = this.doProgress.bind(this);
        this.returnValue = undefined;
    }

    doProgress () {
        this.#progress += Math.random() / 10;
        this.#progressBar.update(this.#progress);
        if (this.#progress >= 1) {
            setTimeout(() => {
                sleep.sleep(1);
                this.returnValue = this.#callback();
            }, 1000);
        } else {
            setTimeout(this.doProgress, 100 + Math.random() * 500);
        }
    }

    run (progressStyle) {
        this.#progressBar = term.progressBar(progressStyle);
        return this.doProgress();
    }
}
