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
import { dnsResolve4, dnsResolve6 } from "./lib.js";
import { resolveMinecraftServerSrvRecord } from "./srv.js";

export { getServerAddressInfo };

async function getServerAddressInfo(serverAddr: string, serverType: ServerType): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, port?: number): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, serverPort?: ServerType | number): Promise<ServerAddressInfo> {
    let valid = true;
    //let invalidReason: any = undefined;
    let ip: string | null = null;
    let port: number | null = null;
    let srvRecord: MCServerSrvRecord | null = null;
    const connectPoints: MCServerAddress[] = [];
    
    let serverAddr0 = serverAddr;
    let serverPort0 = serverPort;
    
    if (isIPV6(serverAddr) || isIPV4(serverAddr)){
        ip = serverAddr;
    } else if (serverPort === "java" || serverPort == null){
        srvRecord = await resolveMinecraftServerSrvRecord(serverAddr);
        if (srvRecord != null){
            serverAddr0 = srvRecord.ip;
            serverPort0 = srvRecord.port;
        }
    }
    
    if (serverPort0 === "java")
        port = 25565;
    else if (serverPort0 === "bedrock")
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
    if (ip == null && valid){
        let dnsIp4: string[] | null = null;
        let dnsIp6: string[] | null = null;
        
        //note: prefer ipv4
        
        try {
            dnsIp4 = await dnsResolve4(serverAddr0);
        } catch {
            //do nothing
        }

        try {
            dnsIp6 = await dnsResolve6(serverAddr0);
        } catch {
            //do nothing
        }
        
        /*
           BDS服务器默认在 IPV6 的 19133 端口运行
           但是这段代码合理吗？
               客户端并不会因为检测到 IPV6 地址就去连接 19133 端口
           
        if (serverPort === "bedrock" && dnsIp4 == null && dnsIp6 != null)
            port = 19133;
        */
        
        
        if (dnsIp4 != null){
            ip = dnsIp4[0];
            if (dnsIp6 != null){
                connectPoints.push({ ip: dnsIp6[0], port });
            }
        } else if (dnsIp6 != null){
            ip = dnsIp6[0];
        } else {
            valid = false;
        }
    }
    
    if (srvRecord != null)
        connectPoints.unshift(srvRecord);
    else if (ip != null && port != null)
        connectPoints.unshift({ ip, port });
        
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
