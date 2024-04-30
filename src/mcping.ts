import { ServerValidAddressInfo, ServerAddressInfo, ServerInvalidAddressInfo, getServerAddressInfo } from "./lib/serverAddr.js";
import { JavaPingResult } from "./types/java.js";
import { BedrockPingResult } from "./types/bedrock.js";
import { pingJava } from "./lib/java.js";
import { pingBedrock } from "./lib/bedrock.js";

export { mcping };

// 有些代码，看起来还不错，其实里边已经成屎了
// 就比如下边的这个mcping

async function mcping(host: string): Promise<MCPingResult>
async function mcping(host: string, option: MCPingOption): Promise<MCPingResult> 
async function mcping(host: string, port: number): Promise<MCPingResult> 
async function mcping(host: string, serverType: ServerType): Promise<MCPingResult> 
async function mcping(option: MCPingOption): Promise<MCPingResult> 
async function mcping(host: string | MCPingOption, option?: ServerType | number | MCPingOption): Promise<MCPingResult> {
    if (typeof host !== "string"){
       option = host;
       host = host.serverAddr as string;
    }
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
        protocolVersionCode = 4,
        resolveSrvRecord = true,
        addressFamily,
        preferIpv6,
        throwsOnInvalid = true,
        throwsOnFail = false,
        serverAddressFilter
    } = option;

    let reason: any[] = [];
    let java: any;
    let bedrock: any;
    let addressJava: ServerAddressInfo & { addressIsValid: boolean } | null = null;
    let addressBedrock: ServerAddressInfo & { addressIsValid: boolean } | null = null;

    if (serverType === "unknown" || serverType === "java"){
        const serverAddressInfoJava = await getServerAddressInfo(host, {
            serverType: "java",
            serverPort,
            resolveSrvRecord,
            family: addressFamily,
            preferIpv6,
            throwsOnInvalid: false
        });
        //@ts-ignore
        addressJava = serverAddressInfoJava;

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

        //@ts-ignore
        addressJava.addressIsValid = addressIsValid;

        if (serverAddressInfoJava.valid && addressIsValid){
            java = await new Promise((resolve, reject) => {
                pingJava({
                   ip: serverAddressInfoJava.ip,
                   port: serverAddressInfoJava.port,
                   serverAddr: forceHostName ?? (serverAddressInfoJava.srvRecord ? serverAddressInfoJava.srvRecord.ip : serverAddr),
                   protocolVersion: protocolVersionCode
                }, (e, r) => {
                    if (e){
                        if (throwsOnFail && serverType === "java")
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

    if (serverType === "unknown" || serverType === "bedrock"){
        const serverAddressInfo = await getServerAddressInfo(host, {
            serverType: "bedrock",
            serverPort,
            resolveSrvRecord,
            family: addressFamily,
            preferIpv6,
            throwsOnInvalid: false
        });
        //@ts-ignore
        addressBedrock = serverAddressInfo;

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

        //@ts-ignore
        addressBedrock.addressIsValid = addressIsValid;

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

    let result: any = {
       status: false
    };
    if (java || bedrock){
        result.status = true;
    }
    if (bedrock){
        result.bedrock = bedrock;
    }
    if (java){
        result.java = java;
    }
    if (addressJava){
        result.addressJava = addressJava;
    }
    if (addressBedrock){
        result.addressBedrock = addressBedrock;
    }
    if (!result.status){
        let finalError;
        if (reason.length > 1){
            finalError = new AggregateError(reason);
        } else if (reason[0] instanceof Error){
            finalError = reason[0];
        } else if (reason[0] != null){
            finalError = new Error(reason[0]);
        } else {
            finalError = new Error("unknown error");
        }
        result.reason = finalError;
    }
    if (throwsOnFail && !result.status){
        throw result.reason;
    } else {
        return result;
    }
}

export type ServerType = "java" | "bedrock" | "unknown";

export interface MCPingOption {
    serverAddr?: string
    serverType?: ServerType
    serverPort?: number
    /**
     * 在向服务器发送请求时使用指定的主机名。
     */
    forceHostName?: string
    protocolVersionCode?: number
    resolveSrvRecord?: boolean | "force"
    addressFamily?: 4 | 6
    preferIpv6?: boolean
    throwsOnInvalid?: boolean
    throwsOnFail?: boolean
    serverAddressFilter?: (address: string, port: number) => boolean
}

export type MCPingResult = MCPingFailResult
   | MCPingSuccessWithJavaResult
   | MCPingSuccessWithBedrockResult;

export type MCPingSuccessResult = MCPingSuccessWithBedrockResult | MCPingSuccessWithJavaResult | (MCPingSuccessWithBedrockResult & MCPingSuccessWithJavaResult)

export type MCPingSuccessWithJavaResult = {
    status: true;
    java: JavaPingResult;
    addressJava: ServerValidAddressInfo & { addressIsValid: true };
}

export type MCPingSuccessWithBedrockResult = {
    status: true;
    bedrock: BedrockPingResult;
    addressBedrock: ServerValidAddressInfo & { addressIsValid: true };
}

export type MCPingFailResult = {
    status: false;
    reason?: any;
    addressBedrock?: ServerAddressInfo & { addressIsValid: boolean };
    addressJava?: ServerAddressInfo & { addressIsValid: boolean };
}



/*
 //有点抽象，先不用这个
 
class MinecraftBedrockServerPinger extends MinecraftServerPinger<BedrockPingResult> {
   constructor(){
   }
}

class MinecraftJavaServerPinger extends MinecraftServerPinger<JavaPingResult> {
   constructor(){
   }
}

class MinecraftServerPinger<Result> extends NetworkPinger<Result, ServerValidAddressInfo> {
   constructor(){
   }
   public checkAddress(): boolean {
      
   }
}

abstract class NetworkPinger<Result, AddressInfo> {
   protected addressInfo: AddressInfo;
   public pingServer(): Promise<Result> {
      if (!this.checkAddress()){
         return { status: false, addressIsValid: false };
      }
      return { status: false };
   }
   public checkAddress(): boolean {
      return true;
   }
   public constructor(addressInfo: AddressInfo){
      this.addressInfo = AddressInfo;
   }
}

*/