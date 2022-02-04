'use strict';

const fetch = require('node-fetch');
const {readCacheData} = require("../utils/cache");

const postRequest = async (data, endpoint) => {
    try {
        const postData = JSON.stringify(data);
        const options = {
            method: 'POST',
            body: postData,
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Content-length': Buffer.byteLength(postData)
            }
        };
        const uri = process.env.hostname + endpoint;
        return await fetch(uri, options);
    } catch (error) {
        throw error;
    }
}

const getRequest = async (endpoint, privateEndpoint = true) => {
    try {
        let token = '';
        if (privateEndpoint) token = readCacheData("token");
        const options = {
            method: 'GET',
            headers: {
                'x-access-token': `${token}`,
                'connection': 'keep-alive',
                'Content-Type': 'application/json'
            }
        };
        const uri = "http://localhost:3000" + endpoint;
        return await fetch(uri, options);
    } catch (error) {
        throw error;
    }
}

/**
 * @throws
 * @param endpoint {string}
 * @param patchData {object}
 * @param privateEndpoint {boolean}
 * @returns {Promise<object>}
 */
const patchRequest = async (endpoint, patchData, privateEndpoint = true) => {
    try {
        let token = ' ';
        if (privateEndpoint) token = readCacheData("token");
        const options = {
            method: 'PATCH',
            body: patchData,
            headers: {
                'x-access-token' : `${token}`,
                'connection' : 'keep-alive',
                'Content-Type' : 'application/json',
                'Content-length' : Buffer.byteLength(patchData)
            }
        };
        const uri = "http://localhost:3000" + endpoint;
        return await fetch(uri, options);
    } catch (error) {
        throw error;
    }
}

const deleteRequest = async (endpoint, privateEndPoint = true) => {
    try {
        let token = ' ';
        if (privateEndPoint) token = readCacheData("token");
        const options = {
            method: 'DELETE',
            headers: {
                'x-access-token' : `${token}`,
                'connection' : 'keep-alive',
                'Content-Type' : 'application/json',
            }
        };
        const uri = "http://localhost:3000" + endpoint;
        return await fetch(uri, options);
    } catch (error) {
        throw error;
    }
}

module.exports = { postRequest, getRequest, patchRequest, deleteRequest };
