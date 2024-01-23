import { JavaPingResult } from "./java.js";
import { BedrockPingResult } from "./bedrock.js";
export { mcping };
declare function mcping(host: string, option: MCPingOption): Promise<MCPingResult>;
declare function mcping(host: string, port: number): Promise<MCPingResult>;
declare function mcping(host: string, serverType: ServerType): Promise<MCPingResult>;
export type ServerType = "java" | "bedrock" | "unknown";
export interface MCPingOption {
    serverAddr?: string;
    serverType?: ServerType;
    serverPort?: number;
    noSrv?: boolean;
    addressFamily?: 4 | 6;
    preferIpv6?: boolean;
    throwsOnInvalid?: boolean;
    throwsOnFail?: boolean;
}
export type MCPingResult = MCPingSuccessResult | MCPingFailResult;
export type MCPingSuccessResult = {
    status: true;
    java?: JavaPingResult;
    bedrock?: BedrockPingResult;
};
export type MCPingFailResult = {
    status: false;
    reason?: any;
};
