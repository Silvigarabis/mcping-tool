/**
 * Implementation of the Java Minecraft ping protocol.
 * @see https://wiki.vg/Server_List_Ping
 */

'use strict';

import net from 'net';
import varint from './varint.js';

const PROTOCOL_VERSION = 0;

/**
 * Ping a Minecraft Java server.
 * @param {string} ip The ip address of the Java server.
 * @param {number} [port=25565] The port of the Java server.
 * @param {import("../types/lib/java.js").PingCallback} cb The callback function to handle the ping response.
 * @param {number} [timeout=5000] The timeout duration in milliseconds.
 */
export function ping(ip, port = 25565, cb, timeout = 5000, serverAddr = ip) {
    const socket = net.createConnection(({ host: ip, port }));

    // Set manual timeout interval.
    // This ensures the connection will NEVER hang regardless of internal state
    const timeoutTask = setTimeout(() => {
        socket.emit('error', new Error('Socket timeout'));
    }, timeout);

    const closeSocket = () => {
        socket.destroy();
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

    // #setNoDelay instantly flushes data during read/writes
    // This prevents the runtime from delaying the write at all
    socket.setNoDelay(true);

    socket.on('connect', () => {
        const handshake = varint.concat([
            varint.encodeInt(0),
            varint.encodeInt(PROTOCOL_VERSION),
            varint.encodeInt(serverAddr.length),
            varint.encodeString(serverAddr),
            varint.encodeUShort(port),
            varint.encodeInt(1)
        ]);

        socket.write(handshake);

        const request = varint.concat([
            varint.encodeInt(0)
        ]);

        startPingConnectTime = Date.now();

        socket.write(request);
    });

    let incomingBuffer = Buffer.alloc(0);

    socket.on('data', (data) => {
        if (pingDelay == null)
            pingDelay = Date.now() - startPingConnectTime;

        incomingBuffer = Buffer.concat([incomingBuffer, data]);

        // Wait until incomingBuffer is at least 5 bytes long to ensure it has captured the first VarInt value
        // This value is used to determine the full read length of the response
        // "VarInts are never longer than 5 bytes"
        // https://wiki.vg/Data_types#VarInt_and_VarLong
        if (incomingBuffer.length < 5) {
            return;
        }

        let offset = 0;
        const packetLength = varint.decodeInt(incomingBuffer, offset);

        // Ensure incomingBuffer contains the full response
        if (incomingBuffer.length - offset < packetLength) {
            return;
        }

        const packetId = varint.decodeInt(incomingBuffer, varint.decodeLength(packetLength));

        if (packetId === 0) {
            const data = incomingBuffer.subarray(varint.decodeLength(packetLength) + varint.decodeLength(packetId));
            const responseLength = varint.decodeInt(data, 0);
            const response = data.subarray(varint.decodeLength(responseLength), varint.decodeLength(responseLength) + responseLength);

            try {
                const message = JSON.parse(response);

                closeSocket();
                cb(null, { pingDelay, pingResponse: message });
            } catch (err) {
                handleError(err);
            }
        } else {
            handleError(new Error('Received unexpected packet'));
        }
    });

    socket.on('error', handleError);
}

/**
 * Asynchronously ping Minecraft Java server.
 * The optional `options` argument can be an object with a `ping` (default is `25565`) or/and `timeout` (default is `5000`) property.
 * @param {string} host The Java server address.
 * @param {import('../types/index.js').PingOptions} options The configuration for pinging Minecraft Java server.
 * @returns {Promise<import('../types/index.js').JavaPingResponse>}
 */
export function pingJava(host, options = {}) {
    if (!host) throw new Error('Host argument is not provided');

    const { port = 25565, timeout = 5000 } = options;

    return new Promise((resolve, reject) => {
        ping(host, port, (err, res) => {
            err ? reject(err) : resolve(res.pingResponse);
        }, timeout);
    });
}