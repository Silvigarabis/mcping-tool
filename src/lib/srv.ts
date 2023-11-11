import * as dns from "node:dns";
import { createPendingPromise } from "./lib.js";

export type MinecraftServerSrvResolveResult = {
    ip: string
    port: number
}

export function resolveMinecraftServerSrvRecord(name: string, timeout: number = 5000): Promise<MinecraftServerSrvResolveResult | null> {
    const pendingPromise = createPendingPromise();
    
    dns.resolveSrv("_minecraft._tcp." + name, onDnsReceive);
    
    // 超时设置
    setTimeout(() => {
        pendingPromise.resolve(null);
    }, timeout);
    
    function onDnsReceive(e, r){
        try {
            if (e || !r || r.length === 0){
                pendingPromise.resolve(null);
            } else {
                let record = r[0];
                let { name: ip, port } = record;
                pendingPromise.resolve({ ip, port });
            }
        } catch {
            //nothing, just wait until timeout
        }
    }
    
    return pendingPromise.promise;
}
