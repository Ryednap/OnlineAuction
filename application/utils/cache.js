require('dotenv').config()
const fs = require('fs');
const path = require('path');
const Buffer = require('buffer').Buffer;
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.secret);

/**
 *
 * @param filename {string}
 * @param data {string | Object}
 */

function writeCacheData (filename, data) {
    if (Object.getPrototypeOf(data) === Object.prototype) {
        data = JSON.stringify(data);
    }

    const str = Buffer.from(cryptr.encrypt(data));
    fs.writeFile(path.resolve(process.cwd(), "data", filename + '.dat'),
        str, "binary", (err) => {
       if (err) {
           console.log(`Caught error during caching data: ${err.message}`);
       }
    });
}

/**
 *
 * @param filename
 * @return {string | JSON | *}
 */

function readCacheData (filename) {
    const filePath = path.resolve(process.cwd(), "data", filename + '.dat');
    let data = fs.readFileSync(filePath, "binary");
    data = cryptr.decrypt(data);
    try {
        return JSON.parse(data);
    } catch (error) {
        // string is not json parsable
        return data;
    }
}


module.exports = {writeCacheData, readCacheData};