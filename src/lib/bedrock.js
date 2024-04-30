/**
 * Implementation of the RakNet ping/pong protocol.
 * @see https://wiki.vg/Raknet_Protocol#Unconnected_Ping
 *
 * Data types:
 * @see https://wiki.vg/Raknet_Protocol#Data_types
 */

'use strict';

import dgram from 'dgram';
import { isIPV6 } from "./serverAddr.js";

const START_TIME = new Date().getTime();

/**
 * Creates a buffer with the specified length.
 * @param {number} length - The length of the buffer.
 * @returns {Buffer} - The created buffer.
 */
const createBuffer = (length) => {
    const buffer = Buffer.alloc(length);
    buffer[0] = 0x01;
    return buffer;
};

/**
 * Writes a BigInt value to the buffer at the specified offset using big-endian byte order.
 * @param {Buffer} buffer - The buffer to write to.
 * @param {number} value - The BigInt value to write.
 * @param {number} offset - The offset in the buffer to write the value.
 */
const writeBigInt64BE = (buffer, value, offset) => {
    buffer.writeBigInt64BE(BigInt(value), offset);
};

/**
 * Copies the specified hex value to the buffer at the specified offset.
 * @param {Buffer} buffer - The buffer to copy to.
 * @param {string} hex - The hex value to copy.
 * @param {number} offset - The offset in the buffer to copy the value.
 */
const copyHexToBuffer = (buffer, hex, offset) => {
    Buffer.from(hex, 'hex').copy(buffer, offset);
};

/**
 * Reads a BigInt value from the buffer at the specified offset using big-endian byte order.
 * @param {Buffer} buffer - The buffer to read from.
 * @param {number} offset - The offset in the buffer to read the value.
 * @returns {BigInt} - The read BigInt value.
 */
const readBigInt64BE = (buffer, offset) => {
    return buffer.readBigInt64BE(offset);
};

/**
 * Reads a string from the buffer at the specified offset.
 * @param {Buffer} buffer - The buffer to read from.
 * @param {number} offset - The offset in the buffer to read the string.
 * @returns {string} - The read string.
 */
const readStringFromBuffer = (buffer, offset) => {
    const length = buffer.readUInt16BE(offset);
    return buffer.toString('utf8', offset + 2, offset + 2 + length);
};

/**
 * Parses the advertise string into an object with properties.
 * @param {string} advertiseStr - The advertise string to parse.
 * @returns {Object} - The parsed object with properties.
 */
const parseAdvertiseString = (advertiseStr) => {
    const parts = advertiseStr.split(';');
    return {
        gameId: parts[0],
        description: parts[1],
        protocolVersion: Number(parts[2]),
        gameVersion: parts[3],
        currentPlayers: Number(parts[4]),
        maxPlayers: Number(parts[5]),
        name: parts[7],
        mode: parts[8],
        modeCode: Number(parts[9]),
        ipv4Port: Number(parts[10]),
        ipv6Port: Number(parts[11]),
        serverId: parts[6],
    };
};

/**
 * Creates an Unconnected Ping buffer.
 * @param {number} pingId - The ping ID.
 * @returns {Buffer} - The Unconnected Ping buffer.
 * @see {@link https://wiki.vg/Raknet_Protocol#Unconnected_Ping}
 */
const UNCONNECTED_PING = (pingId) => {
    const buffer = createBuffer(35);
    writeBigInt64BE(buffer, pingId, 1);
    copyHexToBuffer(buffer, '00ffff00fefefefefdfdfdfd12345678', 9);
    writeBigInt64BE(buffer, 0, 25);
    return buffer;
};

/**
 * Decodes an Unconnected Pong buffer and returns the parsed data.
 * @param {Buffer} buffer - The Unconnected Pong buffer.
 * @returns {Object} - The parsed Unconnected Pong data.
 * @see {@link https://wiki.vg/Raknet_Protocol#Unconnected_Pong}
 */
const UNCONNECTED_PONG = (buffer) => {
    const pingId = readBigInt64BE(buffer, 1);
    const serverId = readBigInt64BE(buffer, 9);
    let offset = 25;
    let advertiseStr;

    try {
        advertiseStr = readStringFromBuffer(buffer, offset);
    } catch (err) {
        const length = parseInt(err.message.substr(err.message.indexOf(',') + 2, 3));
        advertiseStr = buffer.toString('utf8', offset, offset + length);
    }

    const parsedAdvertiseStr = parseAdvertiseString(advertiseStr);

    return { pingId, advertiseStr, serverId, offset, ...parsedAdvertiseStr };
};

/**
 * Sends a ping request to the specified ip and port.
 * @param {string} ip - The IP address of the server.
 * @param {number} port - The port number.
 * @param {import("../types/bedrock.js").BedrockPingCallback} cb - The callback function to handle the response.
 * @param {number} [timeout=5000] - The timeout duration in milliseconds.
 */
export function pingBedrock(ip, port, cb, timeout = 5000){
    let socket;

    if (isIPV6(ip)){
        socket = dgram.createSocket('udp6');
    } else {
        socket = dgram.createSocket('udp4');
    }

    // Set manual timeout interval.
    // This ensures the connection will NEVER hang regardless of internal state
    const timeoutTask = setTimeout(() => {
        socket.emit('error', new Error('Socket timeout'));
    }, timeout);

    const closeSocket = () => {
        socket.close();
        clearTimeout(timeoutTask);
    };

    // Generic error handler
    // This protects multiple error callbacks given the complex socket state
    // This is mostly dangerous since it can swallow errors
    let didFireError = false;

    /**
     * Handle any error that occurs during the ping process.
     * @param {Error} err The error that occurred.
     */
    const handleError = (err) => {
        closeSocket();

        if (!didFireError) {
            didFireError = true;
            cb(err, null);
        }
    };

    let startPingConnectTime = 0;
    let pingDelay = null;

    try {
        const ping = UNCONNECTED_PING(new Date().getTime() - START_TIME);
        startPingConnectTime = Date.now();
        socket.send(ping, 0, ping.length, port, ip);
    } catch (err) {
        handleError(err);
    }

    socket.on('message', (msg) => {
        if (pingDelay == null)
            pingDelay = Date.now() - startPingConnectTime;

        const id = msg[0];

        switch (id) {
            case 0x1c: {
                const pong = UNCONNECTED_PONG(msg);
                const clientData = {
                    version: {
                        name: pong.name,
                        protocol: Number(pong.protocolVersion)
                    },
                    players: {
                        max: Number(pong.maxPlayers),
                        online: Number(pong.currentPlayers)
                    },
                    description: pong.description,
                    gamemode: pong.mode,
                    detailInfo: pong,
                };

                closeSocket();
                cb(null, { pingDelay, pingResponse: clientData });
                break;
            }

            default: {
                handleError(new Error('Received unexpected packet'));
                break;
            }
        }
    });

    socket.on('error', handleError);
};
