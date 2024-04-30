export type BedrockPingResponse = {
    version: {
        name: string;
        protocol: number;
    };
    players: {
        max: number;
        online: number;
    };
    description: string;
    gamemode: string;
    detailInfo: BedrockPingDetailInfo;
};
export type BedrockPingDetailInfo = {
    gameId: string;
    description: string;
    protocolVersion: number;
    gameVersion: string;
    currentPlayers: number;
    maxPlayers: number;
    name: string;
    mode: string;
    modeCode: number;
    ipv4Port: number;
    ipv6Port: number;
    serverId: string;
};
export type BedrockPingResult<Response extends BedrockPingResponse = BedrockPingResponse> = {
    pingDelay: number;
    pingResponse: Response;
    rawObject: BedrockPingDetailInfo;
};
export type BedrockPingCallback = (err: any, result: BedrockPingResult) => any;
//# sourceMappingURL=bedrock.d.ts.map