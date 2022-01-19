const {getRequest} = require('./api/apiReq');

function main () {
    setInterval (async () => {
        const data = await getRequest('/auction/list');
        const body = await data.json();
        console.log(body);
    }, 1000);

    setInterval (async () => {
        const data = await getRequest('/auction/list');
        const body = await data.json();
        console.log(body);
    }, 1000);
}

main ();