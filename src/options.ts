import { MCPingOption } from "./mcping.js";

const McpingOptionAllowKeys = [
    "serverAddr",
    "serverType",
    "serverPort",
    "forceHostName",
    "protocolVersionCode",
    "resolveSrvRecord",
    "addressFamily",
    "preferIpv6",
    "throwsOnInvalid",
    "throwsOnFail",
    "serverAddressFilter"
];
const AllowServerTypeList = [ "java", "bedrock", "unknown" ];

export function checkMcpingOption(option: object, throwsOnInvalid: boolean = true): boolean {
    const setResult = (result: boolean, message?: string | Error) => {
        if (message == null){
            message = "Invalid mcping option";
        }
        if (typeof message === "string"){
            message = new TypeError(message);
        }
        if (result){
            return true;
        }
        if (throwsOnInvalid){
            throw message;
        }
        return false;
    };

    if (option == null){
        return setResult(false, "Bad null object");
    }

    for (const key in option){
        if (!McpingOptionAllowKeys.includes(key)){
            return setResult(false, new ReferenceError("Unknown key '" + key + "'"));
        }
    }

    const {
        serverAddr,
        serverType,
        serverPort,
        forceHostName,
        protocolVersionCode,
        resolveSrvRecord,
        addressFamily,
        preferIpv6,
        throwsOnInvalid: throwsOnInvalid_prop,
        throwsOnFail,
        serverAddressFilter
    } = option as unknown as MCPingOption;

    if (typeof serverAddr !== "string"){
        return setResult(false, "Undefined 'serverAddr' in option");
    }
    if (serverType != null && !AllowServerTypeList.includes(serverType)){
        return setResult(false, "Invalid 'serverType': " + serverType);
    }
    if (serverType == null && typeof serverPort !== "number"){
        return setResult(false, "Undefined 'serverPort'");
    }
    
    if (typeof serverPort === "number" && (serverPort <= 0 || serverPort >= 65536)){
        return setResult(false, "Property 'serverPort' out of range [1,65535], is " + serverPort);
    }

    if (forceHostName != null && typeof forceHostName !== "string"){
        return setResult(false, "Invalid 'forceHostName', must be a string.");
    }

    if (resolveSrvRecord != null && (resolveSrvRecord !== "force" || typeof resolveSrvRecord !== "boolean")){
        return setResult(false, "Invalid 'resolveSrvRecord': " + resolveSrvRecord);
    }

    if (addressFamily != null && addressFamily !== 4 && addressFamily !== 6){
        return setResult(false, "Invalid 'addressFamily': " + addressFamily + ", only `4` and `6` are allowed");
    }

    if (preferIpv6 != null && typeof preferIpv6 !== "boolean"){
        return setResult(false, "Invalid 'preferIpv6'");
    }

    if (throwsOnInvalid_prop != null && typeof throwsOnInvalid_prop !== "boolean"){
        return setResult(false, "Invalid 'throwsOnInvalid'");
    }

    if (throwsOnFail != null && typeof throwsOnFail !== "boolean"){
        return setResult(false, "Invalid 'throwsOnFail'");
    }

    if (serverAddressFilter != null && typeof serverAddressFilter !== "function"){
        return setResult(false, "Invalid 'serverAddressFilter', must be a function");
    }

    return setResult(true);
}
