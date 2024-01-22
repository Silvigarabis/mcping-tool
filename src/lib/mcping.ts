import { ServerValidAddressInfo, getServerAddressInfo } from "./serverAddr.js";
import { JavaPingResult } from "../types/lib/java.js";
import { BedrockPingResult } from "../types/lib/bedrock.js";
import { ping as pingJava } from "./java.js";
import { ping as pingBedrock } from "./bedrock.js";

export { mcping };
async function mcping(host: string, option: MCPingOption): Promise<MCPingResult> 
async function mcping(host: string, port: number): Promise<MCPingResult> 
async function mcping(host: string, serverType: ServerType): Promise<MCPingResult> 
async function mcping(host: string, option: ServerType | number | MCPingOption): Promise<MCPingResult> {
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
        noSrv,
        addressFamily,
        preferIpv6,
        throwsOnInvalid = true,
        throwsOnFail = false
    } = option;
    
    let java: any;
    let bedrock: any;
    let reason: any;
    
    if (serverType === "unknown" || serverType === "java"){
       const serverAddressInfoJava = await getServerAddressInfo(host, {
           serverType: "java",
           serverPort,
           noSrv,
           family: addressFamily,
           preferIpv6,
           throwsOnInvalid
       }) as ServerValidAddressInfo;
       if (serverAddressInfoJava.valid){
          java = await new Promise((resolve, reject) => {
              pingJava(serverAddressInfoJava.ip, serverAddressInfoJava.port, (e, r) => {
                  if (e){
                      if (throwsOnFail && serverType === "java")
                          reject(e);
                      else
                          resolve(undefined);
                      reason = e;
                  } else {
                      resolve(r);
                  }
              }, 5000, serverAddressInfoJava.srvRecord ? serverAddressInfoJava.srvRecord.ip : serverAddr);
          });
          if (serverAddressInfoJava.srvRecord && java)
              java.srvRecord = serverAddressInfoJava.srvRecord;
       }
    }
    
    if (serverType === "unknown" || serverType === "bedrock"){
       const serverAddressInfo = await getServerAddressInfo(host, {
           serverType: "bedrock",
           serverPort,
           noSrv: true,
           family: addressFamily,
           preferIpv6,
           throwsOnInvalid
       }) as ServerValidAddressInfo;
       if (serverAddressInfo.valid){
          bedrock = await new Promise((resolve, reject) => {
              pingBedrock(serverAddressInfo.ip, serverAddressInfo.port, (e, r) => {
                  if (e){
                      if (throwsOnFail && serverType === "bedrock")
                          reject(e);
                      else
                          resolve(undefined);
                      reason = e;
                  } else {
                      resolve(r);
                  }
              }, 5000);
          });
       }
    }
    
    if (java && bedrock)
        return { status: true, java, bedrock };
    else if (java)
        return { status: true, java };
    else if (bedrock)
        return { status: true, bedrock };
    else if (throwsOnFail)
        throw reason instanceof Error ? reason : new Error(reason);
    else
        return { status: false, reason };
}

type ServerType = "java" | "bedrock" | "unknown";

interface MCPingOption {
    serverAddr?: string
    serverType?: ServerType
    serverPort?: number
    noSrv?: boolean
    addressFamily?: 4 | 6
    preferIpv6?: boolean
    throwsOnInvalid?: boolean
    throwsOnFail?: boolean
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