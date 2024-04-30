/**
 * Sends a ping request to the specified ip and port.
 * @param {string} ip - The IP address of the server.
 * @param {number} port - The port number.
 * @param {import("../types/bedrock.js").BedrockPingCallback} cb - The callback function to handle the response.
 * @param {number} [timeout=5000] - The timeout duration in milliseconds.
 */
export function pingBedrock(ip: string, port: number, cb: import("../types/bedrock.js").BedrockPingCallback, timeout?: number | undefined): void;
//# sourceMappingURL=bedrock.d.ts.map