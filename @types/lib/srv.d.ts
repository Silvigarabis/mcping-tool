export type MinecraftServerSrvResolveResult = {
    ip: string;
    port: number;
};
export declare function resolveMinecraftServerSrvRecord(name: string, timeout?: number): Promise<MinecraftServerSrvResolveResult | null>;
//# sourceMappingURL=srv.d.ts.map