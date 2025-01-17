const DataClient = require('./data-client');
const RSCSocket = require('@2003scape/rsc-socket');
const World = require('./model/world');
const bulk = require('bulk-require');
const log = require('bole')('server');
const net = require('net');
const ws = require('ws');

class Server {
    constructor(config) {
        this.config = config;

        this.world = new World(this);
        this.dataClient = new DataClient(this);
    }

    loadPacketHandlers() {
        this.handlers = {};

        const files = bulk(`${__dirname}/packet-handlers`, ['*.js']);

        for (const file of Object.keys(files)) {
            const handlers = files[file];

            for (const handlerName of Object.keys(handlers)) {
                this.handlers[handlerName] = handlers[handlerName];
            }
        }
    }

    handleConnection(socket) {
        socket = new RSCSocket(socket);
        socket.setTimeout(5000);
        socket.server = this;

        socket.on('error', (err) => log.error(err));
        socket.on('timeout', () => socket.close());

        socket.on('message', async (message) => {
            const handler = this.handlers[message.type];

            if (!handler) {
                log.warn(`${socket} no handler for type ${message.type}`);
                return;
            }

            if (
                !socket.player &&
                !/register|login|session|closeConnection/.test(message.type)
            ) {
                log.warn(`${socket} sending ${message.type} before login`);
                socket.close();
                return;
            }

            log.debug(`incoming message from ${socket}`, message);

            try {
                await handler(socket, message);
            } catch (e) {
                log.error(e, socket.toString());
            }
        });

        socket.on('close', async () => {
            if (socket.player) {
                if (socket.player.loggedIn) {
                    await socket.player.logout();
                }

                delete socket.player;
                delete socket.server;
            }

            socket.removeAllListeners();
            log.info(`${socket} disconnected`);
        });

        log.info(`${socket} connected`);
    }

    bindTCP() {
        this.tcpServer = new net.Server();
        this.tcpServer.on('error', (err) => log.error(err));

        this.tcpServer.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        return new Promise((resolve, reject) => {
            this.tcpServer.once('error', reject);

            this.tcpServer.once('listening', () => {
                this.tcpServer.removeListener('error', reject);
                log.info(`listening for TCP connections on port ${port}`);
                resolve();
            });

            const port = this.config.tcpPort;
            this.tcpServer.listen({ port });
        });
    }

    bindWebSocket() {
        const port = this.config.websocketPort;
        this.websocketServer = new ws.Server({ port });
        this.websocketServer.on('error', (err) => log.error(err));

        this.websocketServer.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        log.info(`listening for websocket connections on port ${port}`);
    }

    async init() {
        try {
            await this.dataClient.init();

            await this.world.loadData();
            this.world.tick();

            this.loadPacketHandlers();

            await this.bindTCP();
            this.bindWebSocket();
        } catch (e) {
            log.error(e);
            process.exit(1);
        }
    }
}

module.exports = Server;
