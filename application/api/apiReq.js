const fetch = require('node-fetch');
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
module.exports = postRequest;