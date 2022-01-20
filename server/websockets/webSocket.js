const { Server } = require('socket.io');
const { instrument} = require('@socket.io/admin-ui');
const { validateTokenWS } = require('../middleware/auth');

module.exports = class WebSocket {
    #io;
    numClients;
    constructor(server) {
        const io = new Server(server);
        this.#io = io.of('/auction');
        this.numClients = 0;
        instrument(io, {auth: false});
    }
    start () {
        this.#io.use((socket, next) => {
            if (socket.handshake.auth.token) {
                try {
                    socket.user = validateTokenWS(socket.handshake.auth.token);
                    next();
                } catch (err) {
                    console.log('Caught error in auth');
                    next (new Error(err.message));
                }
            } else {
                next(new Error('Unauthorized-access'));
            }
        });

        this.#io.on('connection', (socket) => {
            this.numClients++;
            console.log(`Connected with client : ${socket.id}`);
            console.log(`Total connected clients : ${this.numClients}`);
        });
    }
};