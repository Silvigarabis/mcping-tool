export type PendingPromise<R> = {
    promise: Promise<R>
    resolve: (value: R | PromiseLike<R>) => void
    reject: (reason?: any) => void
}
/**
 * 创建一个待定状态的 {@link Promise}，还有为此 Promise 设置结果的函数。
 */
export function createPendingPromise<R extends any = any>(): PendingPromise<R> {
    let resolve, reject;
    const promise = new Promise<R>((re, rj) => {
        //此处同步调用
        resolve = re;
        reject = rj;
    });
    return { resolve, reject, promise };
}

import * as dns from "node:dns";

// because I'd experienced something... :(

/**
 * 解析指定域名的 A 记录。
 * @param name 要解析的域名。
 * @param timeout 超时时间，单位为毫秒。
 * @returns 解析结果（一个长度不为0的数组），或者空。
 */
export function dnsResolve4(name: string, timeout: number = 5000): Promise<string[] | null> {
    const pendingPromise = createPendingPromise();
    setTimeout(() => {
        pendingPromise.resolve(null);
    }, timeout);
    dns.resolve4(name, (e, r) => {
        if (e || r.length === 0)
            pendingPromise.resolve(null);
        else
            pendingPromise.resolve(r);
    });
    return pendingPromise.promise;
}

/**
 * 解析指定域名的 AAAA 记录。
 * @param name 要解析的域名。
 * @param timeout 超时时间，单位为毫秒。
 * @returns 解析结果（一个长度不为0的数组），或者空。
 */
export function dnsResolve6(name: string, timeout: number = 5000): Promise<string[] | null> {
    const pendingPromise = createPendingPromise();
    setTimeout(() => {
        pendingPromise.resolve(null);
    }, timeout);
    dns.resolve6(name, (e, r) => {
        if (e || r.length === 0)
            pendingPromise.resolve(null);
        else
            pendingPromise.resolve(r);
    });
    return pendingPromise.promise;
}

