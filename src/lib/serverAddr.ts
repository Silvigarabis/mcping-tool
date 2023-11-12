const ipv6ExactRegex = /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/;
const ipv4ExactRegex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;

/**
 * 检查一段字符串是否代表一个 IPV4 地址。
 */
export function isIPV4(ip: string){
    return ipv4ExactRegex.test(ip);
}

/**
 * 检查一段字符串是否代表一个 IPV6 地址。
 */
export function isIPV6(ip: string){
    return ipv6ExactRegex.test(ip);
}

type MCServerAddress = {
    ip: string
    port: number
}

type MCServerSrvRecord = MCServerAddress;

interface ServerValidAddressInfo {
    valid: true
    srvRecord?: MCServerSrvRecord
    serverAddr: string
    ip: string
    port: number
    connectPoints: MCServerAddress[]
}

interface ServerInvalidAddressInfo {
    valid: false
    serverAddr: string
}

type ServerAddressInfo = ServerValidAddressInfo | ServerInvalidAddressInfo;

import ServerType from "./ServerType.js";
import { dnsLookup } from "./lib.js";
import { resolveMinecraftServerSrvRecord } from "./srv.js";

import type { LookupAddress } from "node:dns";

export { getServerAddressInfo };

type GetServerAddressInfoOptions = {
    serverType?: ServerType
    serverPort?: number
    /**
     * 返回结果中会包含的地址类型。
     *
     * 此选项与 {@link GetServerAddressInfoOptions#preferIpv6} 冲突。
     */
    family?: 4 | 6
    /**
     * 默认优先返回 IPV4 地址，设置该选项为 `true` 则优先返回 IPV6 地址。
     *
     * 此选项与 {@link GetServerAddressInfoOptions#family} 冲突。
     */
    preferIpv6?: boolean
}

async function getServerAddressInfo(serverAddr: string, serverType: ServerType): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, port?: number): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, option: GetServerAddressInfoOptions): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, option: GetServerAddressInfoOptions | ServerType | number = {}): Promise<ServerAddressInfo> {
    let valid = true;
    //let invalidReason: any = undefined;
    let ip: string | null = null;
    let port: number | null = null;
    let srvRecord: MCServerSrvRecord | null = null;
    
    if (option === "java" || option === "bedrock")
        option = { serverType: option };
    else if (typeof option === "number")
        option = { serverPort: option };
    
    /* 我不确定是否需要设置它，这段代码用于检查serverType参数是否正确
    else if (typeof option === "string")
        valid = false;
        //throw new TypeError("unknown server type: " + option);
    */
    
    const {
        serverType,
        serverPort,
        family: addressFamily,
        preferIpv6 = false
    } = option;
    
    const connectPoints: MCServerAddress[] = [];
    
    let serverAddr0 = serverAddr;
    let serverPort0 = serverPort;
    
    if (isIPV6(serverAddr) || isIPV4(serverAddr)){
        if (!addressFamily)
            ip = serverAddr;
        else if (addressFamily === 4 && isIPV4(serverAddr))
            ip = serverAddr;
        else if (addressFamily === 6 && isIPV6(serverAddr))
            ip = serverAddr;
        else
            valid = false;
    }
    
    if (valid && ip == null && (serverType === "java" || serverPort == null) && serverType !== "bedrock"){
        srvRecord = await resolveMinecraftServerSrvRecord(serverAddr);
        if (srvRecord != null){
            serverAddr0 = srvRecord.ip;
            serverPort0 = srvRecord.port;
        }
    }
    
    if (serverType === "java")
        port = 25565;
    else if (serverType === "bedrock")
        port = 19132;
    else if (serverPort0 != null)
        port = serverPort0;
    else {
        valid = false; // serverPort 为空时解析 SRV 记录，但是没有得到结果。
        port = -1; //让后边不要报类型错误，实际上到这里返回的结果就没有它了
    }
    
    /*
       书接上回，这里还没有获得实际的连接地址，并且仍然可能是有效地址
       尝试dns解析
    */
    if (valid && ip == null){
        let dnsIps: LookupAddress[] | null = null;
        try {
            dnsIps = await dnsLookup(serverAddr0);
        } catch {
            // just ignore it
        }
        
        const dnsIp4: string[] = [];
        const dnsIp6: string[] = [];
        
        if (dnsIps != null)
        for (const dnsIp of dnsIps){
            if (!addressFamily || addressFamily === 4){
                if (dnsIp.family === 4)
                    dnsIp4.push(dnsIp.address);
            }
            if (!addressFamily || addressFamily === 6){
                if (dnsIp.family === 6)
                    dnsIp6.push(dnsIp.address);
            }
        }
        
        if (preferIpv6 && dnsIp6.length > 0){
            ip = dnsIp6[0];
        } else if (dnsIp4.length > 0){
            ip = dnsIp4[0];
        } else if (dnsIp6.length > 0){
            ip = dnsIp6[0];
        } else {
            valid = false;
        }
        
        if (dnsIp4.length > 0 && dnsIp6.length > 0){
            if (preferIpv6)
                connectPoints.push({ ip: dnsIp4[0], port });
            else
                connectPoints.push({ ip: dnsIp6[0], port });
        }
    }
    
    if (ip != null && port != null)
        connectPoints.unshift({ ip, port });
    
    //只是一段预防，可能永远也不会出现
    if (connectPoints.length === 0 && valid)
        valid = false;
    
    if (!valid){
        return {
            valid, serverAddr
        };
    } else if (srvRecord != null){
        return {
            valid,
            //@ts-ignore 也许我代码写得太复杂了
            ip,
            port,
            connectPoints,
            srvRecord,
            serverAddr
        };
    } else {
        return {
            valid,
            //@ts-ignore 也许我代码写得太复杂了
            ip,
            port,
            connectPoints,
            serverAddr
        };
    }
}
