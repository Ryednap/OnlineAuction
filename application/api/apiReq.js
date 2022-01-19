'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

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

const getRequest = async (endpoint) => {
    try {
        const filePath = path.resolve(process.cwd(), "data", "secret.bin");
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWUzZDMwNTU2ZmM5OWNmNGIxNDk3NTgiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2NDI1NzU5MjYsImV4cCI6MTY0MjY2MjMyNn0.0OCXO-BbOIsT-ecCpljQoOQDae6T-MzXwGmQtUqWCaE';
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
module.exports = { postRequest, getRequest };