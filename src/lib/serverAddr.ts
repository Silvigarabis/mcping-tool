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

/**
 * 检查一段字符串是否代表一个 IPV4 或 IPV6 地址。
 */
export function isIP(ip: string){
    return isIPV6(ip) || isIPV4(ip);
}

type MCServerAddress = {
    ip: string
    port: number
}

type MCServerSrvRecord = MCServerAddress;

export interface ServerValidAddressInfo {
    valid: true
    srvRecord?: MCServerSrvRecord
    serverAddr: string
    ip: string
    port: number
    connectPoints: MCServerAddress[]
}

export interface ServerInvalidAddressInfo {
    valid: false
    invalidReason?: any
    serverAddr: string
}

export type ServerAddressInfo = ServerValidAddressInfo | ServerInvalidAddressInfo;

import ServerType from "./ServerType.js";
import { dnsLookup } from "./lib.js";
import { resolveMinecraftServerSrvRecord } from "./srv.js";

import type { LookupAddress } from "node:dns";

export { getServerAddressInfo };

type GetServerAddressInfoOptions = {
    /**
     * 服务器类型。
     *
     * 必须至少指定 {@link GetServerAddressInfoOptions#serverType}
     * 或 {@link GetServerAddressInfoOptions#serverPort} 当中的一个，
     * 否则不论如何都无法得到结果。
     */
    serverType?: ServerType
    /**
     * 服务器连接端口。
     *
     * 必须至少指定 {@link GetServerAddressInfoOptions#serverType}
     * 或 {@link GetServerAddressInfoOptions#serverPort} 当中的一个，
     * 否则不论如何都无法得到结果。
     */
    serverPort?: number
    /**
     * 执行对Minecraft服务器的SRV解析。
     *
     * 在未指定 serverPort 并且服务器类型为 java 时默认为真。
     * 
     * "force" 表示无论如何也要进行SRV解析（这可能会与 serverPort 配置冲突）。
     */
    resolveSrvRecord?: boolean | "force"
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
    /**
     * 指定在无法得到有效的结果时抛出错误。
     * 默认为 `false`。
     */
    throwsOnInvalid?: boolean
}

async function getServerAddressInfo(serverAddr: string, serverType: ServerType): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, port?: number): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, option: GetServerAddressInfoOptions): Promise<ServerAddressInfo>;
async function getServerAddressInfo(serverAddr: string, option: GetServerAddressInfoOptions | ServerType | number = {}): Promise<ServerAddressInfo> {
    let valid = true;
    let invalidReason: any;
    
    //let invalidReason: any = undefined;
    let ip: string | null = null;
    let port: number | null = null;
    let srvRecord: MCServerSrvRecord | null = null;
    
    if (option === "java" || option === "bedrock")
        option = { serverType: option };
    else if (typeof option === "number")
        option = { serverPort: option };
    
    const {
        serverType,
        serverPort,
        resolveSrvRecord = true,
        family: addressFamily,
        preferIpv6 = false,
        throwsOnInvalid = false,
    } = option;
    
    const connectPoints: MCServerAddress[] = [];
    
    let serverAddr0 = serverAddr;
    let serverPort0 = serverPort;
    
    /*
        serverPort 与 serverType 至少有一个需要被指定
    */
    if (serverPort == null)
        if (serverType === "java")
            serverPort0 = 25565;
        else if (serverType === "bedrock")
            serverPort0 = 19132;
        else
            setInvalid(new TypeError("invalid argument: serverType"));
    else if (typeof serverPort === "number")
        serverPort0 = serverPort; // 可能有重复的步骤，但是为了可读性没有合并
    else
        setInvalid(new ReferenceError("invalid arguments, cannot determine server type")); //都没有，参数异常
    
    /*
        如果主机名是一个IP地址
    */
    if (valid && isIP(serverAddr)){
        ip = serverAddr;
    }
    
    /*
        在前边的判断中没有找到不正确的参数
        传入的主机名不是IP
        Java版服务器
        端口未指定
        resolveSrvRecord为真

        或者 resolveSrvRecord === "force"

            尝试获取SRV记录
    */
    if (valid && (resolveSrvRecord
        && ip == null
        && serverPort == null
        && serverType == "java"
        || resolveSrvRecord === "force")
    ){
        srvRecord = await resolveMinecraftServerSrvRecord(serverAddr);
        if (srvRecord != null){
            serverAddr0 = srvRecord.ip;
            serverPort0 = srvRecord.port;
        }
    }
    
    // SRV解析得到的主机名可能是IP地址而不是另一个域名
    if (valid && ip == null && isIP(serverAddr0)){
        ip = serverAddr0;
    }
    
    //在这里检查可能存在的IP地址是否与参数 addressFamily 所期望的相同
    //~~同时也判断 addressFamily 参数是否是合法的参数~~ 不检查了，麻烦
    if (valid && ip != null && addressFamily != null){
        if (addressFamily === 4 && !isIPV4(ip))
            setInvalid("address family mismatch");
        else if (addressFamily === 6 && !isIPV6(ip))
            setInvalid("address family mismatch");
    }
        
    /*
        检查端口是否正确
    */

    if (serverPort0 != null)
        port = serverPort0;
    else {
        port = -1;
        setInvalid(new TypeError("missing port argument"));
    }
    
    if (isNaN(port) || port > 65535 || port < 0 /* 话说0是有效的端口嘛？ */){
        port = -1;
        setInvalid("invalid port");
    }
   
    /*
       书接上回，这里还没有获得实际的连接IP，并且仍然可能是有效地址（可能来源自SRV记录）
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
            setInvalid("no dns data");
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
    
    //只是一段预防，可能永远也不会触发
    if (connectPoints.length === 0 && valid)
        setInvalid("no connection point found");
    
    if (valid && resolveSrvRecord === "force" && srvRecord == null){
       setInvalid("no srv record found");
    }

    if (!valid){
        let finalError;
        if (invalidReason instanceof Error){
            finalError = invalidReason;
        } else if (invalidReason != null){
            finalError = new Error(invalidReason);
        } else {
            finalError = new Error("unknown error while resolving dns data");
        }
        
        if (throwsOnInvalid)
            throw finalError;

        return {
            valid, invalidReason: finalError, serverAddr
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
    
    function setInvalid(reason?: any){
        if (valid){
            invalidReason = reason;
            valid = false;
        }
    }
}
