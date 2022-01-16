class Auction {
    #id;
    constructor(id) {
        this.#id = id;
    }
    start() {
        console.log(`Your Auction id is ${this.#id}`);
    }
}

module.exports = Auction;