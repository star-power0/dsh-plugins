/**
 * dsh-remote-control 共享类型：host 半与浏览器半之间的数据形状。
 * 浏览器半只消费 admin JSON 信封，不依赖任何宿主内部类型。
 */
/** 运行时默认配置。 */
export const DEFAULT_CONFIG = {
    host: '0.0.0.0',
    port: 30880,
    trustedHosts: [],
    publicUrl: '',
};
