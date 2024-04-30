import { ServerValidAddressInfo, ServerAddressInfo } from "./lib/serverAddr.js";
import { JavaPingResult } from "./types/java.js";
import { BedrockPingResult } from "./types/bedrock.js";
export { mcping };
declare function mcping(host: string): Promise<MCPingResult>;
declare function mcping(host: string, option: MCPingOption): Promise<MCPingResult>;
declare function mcping(host: string, port: number): Promise<MCPingResult>;
declare function mcping(host: string, serverType: ServerType): Promise<MCPingResult>;
declare function mcping(option: MCPingOption): Promise<MCPingResult>;
export type ServerType = "java" | "bedrock" | "unknown";
export interface MCPingOption {
    serverAddr?: string;
    serverType?: ServerType;
    serverPort?: number;
    /**
     * 在向服务器发送请求时使用指定的主机名。
     */
    forceHostName?: string;
    resolveSrvRecord?: boolean | "force";
    addressFamily?: 4 | 6;
    preferIpv6?: boolean;
    throwsOnInvalid?: boolean;
    throwsOnFail?: boolean;
    serverAddressFilter?: (address: string, port: number) => boolean;
}
export type MCPingResult = MCPingFailResult | MCPingSuccessWithJavaResult | MCPingSuccessWithBedrockResult;
export type MCPingSuccessResult = MCPingSuccessWithBedrockResult | MCPingSuccessWithJavaResult | (MCPingSuccessWithBedrockResult & MCPingSuccessWithJavaResult);
export type MCPingSuccessWithJavaResult = {
    status: true;
    java: JavaPingResult;
    addressJava: ServerValidAddressInfo & {
        addressIsValid: true;
    };
};
export type MCPingSuccessWithBedrockResult = {
    status: true;
    bedrock: BedrockPingResult;
    addressBedrock: ServerValidAddressInfo & {
        addressIsValid: true;
    };
};
export type MCPingFailResult = {
    status: false;
    reason?: any;
    addressBedrock?: ServerAddressInfo & {
        addressIsValid: boolean;
    };
    addressJava?: ServerAddressInfo & {
        addressIsValid: boolean;
    };
};
//# sourceMappingURL=mcping.d.ts.map