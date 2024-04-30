/**
 * 检查一段字符串是否代表一个 IPV4 地址。
 */
export declare function isIPV4(ip: string): boolean;
/**
 * 检查一段字符串是否代表一个 IPV6 地址。
 */
export declare function isIPV6(ip: string): boolean;
/**
 * 检查一段字符串是否代表一个 IPV4 或 IPV6 地址。
 */
export declare function isIP(ip: string): boolean;
type MCServerAddress = {
    ip: string;
    port: number;
};
type MCServerSrvRecord = MCServerAddress;
export interface ServerValidAddressInfo {
    valid: true;
    srvRecord?: MCServerSrvRecord;
    serverAddr: string;
    ip: string;
    port: number;
    connectPoints: MCServerAddress[];
}
export interface ServerInvalidAddressInfo {
    valid: false;
    invalidReason?: any;
    serverAddr: string;
}
export type ServerAddressInfo = ServerValidAddressInfo | ServerInvalidAddressInfo;
export { getServerAddressInfo };
export type ServerType = "java" | "bedrock";
export type GetServerAddressInfoOptions = {
    /**
     * 服务器类型。
     *
     * 必须至少指定 {@link GetServerAddressInfoOptions#serverType}
     * 或 {@link GetServerAddressInfoOptions#serverPort} 当中的一个，
     * 否则不论如何都无法得到结果。
     */
    serverType?: ServerType;
    /**
     * 服务器连接端口。
     *
     * 必须至少指定 {@link GetServerAddressInfoOptions#serverType}
     * 或 {@link GetServerAddressInfoOptions#serverPort} 当中的一个，
     * 否则不论如何都无法得到结果。
     */
    serverPort?: number;
    /**
     * 执行对Minecraft服务器的SRV解析。
     *
     * 在未指定 serverPort 并且服务器类型为 java 时默认为真。
     *
     * "force" 表示无论如何也要进行SRV解析（这可能会与 serverPort 配置冲突）。
     */
    resolveSrvRecord?: boolean | "force";
    /**
     * 返回结果中会包含的地址类型。
     *
     * 此选项与 {@link GetServerAddressInfoOptions#preferIpv6} 冲突。
     */
    family?: 4 | 6;
    /**
     * 默认优先返回 IPV4 地址，设置该选项为 `true` 则优先返回 IPV6 地址。
     *
     * 此选项与 {@link GetServerAddressInfoOptions#family} 冲突。
     */
    preferIpv6?: boolean;
    /**
     * 指定在无法得到有效的结果时抛出错误。
     * 默认为 `false`。
     */
    throwsOnInvalid?: boolean;
};
declare function getServerAddressInfo(serverAddr: string, serverType: ServerType): Promise<ServerAddressInfo>;
declare function getServerAddressInfo(serverAddr: string, port?: number): Promise<ServerAddressInfo>;
declare function getServerAddressInfo(serverAddr: string, option: GetServerAddressInfoOptions): Promise<ServerAddressInfo>;
//# sourceMappingURL=serverAddr.d.ts.map