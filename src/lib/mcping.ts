import { ServerValidAddressInfo, ServerInvalidAddressInfo, getServerAddressInfo } from "./serverAddr.js";
import { JavaPingResult } from "../types/lib/java.js";
import { BedrockPingResult } from "../types/lib/bedrock.js";
import { ping as pingJava } from "./java.js";
import { ping as pingBedrock } from "./bedrock.js";

export { mcping };
async function mcping(host: string): Promise<MCPingResult> 
async function mcping(host: string, option: MCPingOption): Promise<MCPingResult> 
async function mcping(host: string, port: number): Promise<MCPingResult> 
async function mcping(host: string, serverType: ServerType): Promise<MCPingResult> 
async function mcping(host: string, option?: ServerType | number | MCPingOption): Promise<MCPingResult> {
    if (typeof option === "number")
        option = { serverPort: option } as MCPingOption;
    else if (typeof option === "string")
        option = { serverType: option } as unknown as MCPingOption;
    else if (!option)
        option = {};

    const {
        serverAddr = host,
        serverType = "unknown",
        serverPort,
        forceHostName,
        resolveSrvRecord = true,
        addressFamily,
        preferIpv6,
        throwsOnInvalid = true,
        throwsOnFail = false,
        serverAddressFilter
    } = option;

    let java: any;
    let bedrock: any;
    let reason: any[] = [];

    if (serverType === "unknown" || serverType === "java"){
        const serverAddressInfoJava = await getServerAddressInfo(host, {
            serverType: "java",
            serverPort,
            resolveSrvRecord,
            family: addressFamily,
            preferIpv6,
            throwsOnInvalid: false
        });

        if (!serverAddressInfoJava.valid){
            reason[reason.length] = serverAddressInfoJava.invalidReason;
        }

        let addressIsValid = true;

        if (serverAddressInfoJava.valid && serverAddressFilter != null){
            try {
                addressIsValid = serverAddressFilter(serverAddressInfoJava.ip, serverAddressInfoJava.port);
                if (!addressIsValid){
                    reason[reason.length] = new Error("address check fail from serverAddressFilter");
                }
            } catch(e){
                reason[reason.length] = e;
                addressIsValid = false;
            }
        }

        if (serverAddressInfoJava.valid && addressIsValid){
            java = await new Promise((resolve, reject) => {
                pingJava(serverAddressInfoJava.ip, serverAddressInfoJava.port, (e, r) => {
                    if (e){
                        if (throwsOnFail && serverType === "java")
                            reject(e);
                        else
                            resolve(undefined);
                        reason[reason.length] = e;
                    } else {
                        resolve(r);
                    }
                }, 5000, forceHostName ?? (serverAddressInfoJava.srvRecord ? serverAddressInfoJava.srvRecord.ip : serverAddr));
            });
            if (serverAddressInfoJava.srvRecord && java)
                java.srvRecord = serverAddressInfoJava.srvRecord;
        }
    }

    if (serverType === "unknown" || serverType === "bedrock"){
        const serverAddressInfo = await getServerAddressInfo(host, {
            serverType: "bedrock",
            serverPort,
            resolveSrvRecord,
            family: addressFamily,
            preferIpv6,
            throwsOnInvalid: false
        });

        if (!serverAddressInfo.valid){
            reason[reason.length] = serverAddressInfo.invalidReason;
        }

        let addressIsValid = true;

        if (serverAddressInfo.valid && serverAddressFilter != null){
            try {
                addressIsValid = serverAddressFilter(serverAddressInfo.ip, serverAddressInfo.port);
                if (!addressIsValid){
                    reason[reason.length] = new Error("address check fail from serverAddressFilter");
                }
            } catch(e){
                reason[reason.length] = e;
                addressIsValid = false;
            }
        }

        if (serverAddressInfo.valid && addressIsValid){
            bedrock = await new Promise((resolve, reject) => {
                pingBedrock(serverAddressInfo.ip, serverAddressInfo.port, (e, r) => {
                    if (e){
                        if (throwsOnFail && serverType === "bedrock")
                            reject(e);
                        else
                            resolve(undefined);
                        reason[reason.length] = e;
                    } else {
                        resolve(r);
                    }
                }, 5000);
            });
        }
    }

    if (java && bedrock){
        return { status: true, java, bedrock };
    } else if (java){
        return { status: true, java };
    } else if (bedrock){
        return { status: true, bedrock };
    } else {
        let finalError;
        if (reason.length > 1){
            finalError = new AggregateError(reason);
        } else if (reason[0] instanceof Error){
            finalError = reason[0];
        } else if (reason[0] != null){
            finalError = new Error(reason[0]);
        }
        if (throwsOnFail){
            throw finalError;
        } else {
            return { status: false, reason: finalError };
        }
    }
}

type ServerType = "java" | "bedrock" | "unknown";

interface MCPingOption {
    serverAddr?: string
    serverType?: ServerType
    serverPort?: number
    /**
     * 在向服务器发送请求时使用指定的主机名。
     */
    forceHostName?: string
    resolveSrvRecord?: boolean | "force"
    addressFamily?: 4 | 6
    preferIpv6?: boolean
    throwsOnInvalid?: boolean
    throwsOnFail?: boolean
    serverAddressFilter?: (address: string, port: number) => boolean
}

type MCPingResult = MCPingSuccessResult | MCPingFailResult

type MCPingSuccessResult = {
    status: true;
    java?: JavaPingResult
    bedrock?: BedrockPingResult
}

type MCPingFailResult = {
    status: false;
    reason?: any;
}
