async function add(a, b) {
    return a + b;
}

async function main() {
    const result = await add(2, 3);
    console.log(result);
}

console.log(require('crypto').randomBytes(64).toString('hex'));
main();