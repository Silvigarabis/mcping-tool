/**
 * JSON format chat component used for description field.
 * @see https://wiki.vg/Chat
 */
export type ChatComponent = {
    type?: "text" | "translatable" | "score" | "nbt" | "selector" | "keybind";

    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    color?: string;

    text?: string;

    translate?: string;
    with?: ChatComponent[];
    fallback?: string;

    extra?: ChatComponent[];
};

export type SampleProp = {
    name: string;
    id: string;
};

/**
 * `JSON Response` field of Response packet.
 * @see https://wiki.vg/Server_List_Ping#Response
 */
export type JavaPingResponse = {
    version: {
        name: string;
        protocol: number;
    };
    players: {
        max: number;
        online: number;
        sample?: SampleProp[];
    };
    description: string | ChatComponent;
    favicon?: string;
    enforcesSecureChat?: boolean;
    previewsChat?: boolean;
};

/**
 * 返回的查询结果。对于非原版服务器，其结果可能有所不同。
 */
export type JavaPingResult<Response extends JavaPingResponse = JavaPingResponse> = {
    pingDelay: number;
    pingResponse: Response;
};

export type JavaPingCallback = (err: any, response: JavaPingResult) => any

export type JavaPingOption = {
   /**
    * The ip address of the Java server.
    */
   ip: string;
   /**
    * port The port of the Java server.
    */
   port: number;
   /**
    * 查询中会包含的服务器地址信息。
    * 默认与 `ip` 相同。
    */
   serverAddr?: string
   serverPort?: number
   protocolVersion?: number
}
