/**
 * dsh-remote-control — 进程内官方 API 桥。
 *
 * 复用宿主 API 网关的宿主侧 fetch 载体（toFetchHandler(ctx.apiProxy)），
 * 手机侧请求在插件进程内直接变成一次官方 client-request 调用：
 * 不反代、不触网、不经过官方 /api 的回环 fence。
 */
import { randomUUID } from 'node:crypto';
import { toFetchHandler } from '@deepseek-ai/dsh-host-apiproxy';
/** M2 暴露给已配对设备的方法白名单（控制面：列表 / 历史 / 发话 / 中止 / 模型目录与切换 / 工作区清单 / 队列管理）。 */
export const REMOTE_METHOD_ALLOWLIST = [
    'session.list',
    'session.history',
    'session.prompt',
    'session.cancel',
    'session.models',
    'session.selectModel',
    'session.create',
    'session.rename',
    'session.updateQueue',
    'session.attachment',
    'agentPreset.list',
    'agentPreset.select',
    'workspace.archiveSession',
    'workspace.list',
    'skill.list',
];
export function createProxyBridge(apiProxy) {
    // apiProxy 实例由宿主运行时提供，结构满足 toFetchHandler 的参数面。
    const handler = toFetchHandler(apiProxy);
    async function call(method, payload) {
        const rpcId = randomUUID();
        const request = new Request(`http://in-process.dsh-remote-control/api/${method}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'client-request', rpcId, method, payload }),
        });
        const response = await handler.fetch(request);
        const envelope = (await response.json());
        if (envelope.type !== 'server-response' || envelope.result === undefined) {
            return { ok: false, error: { code: 'internal', message: '网关返回了未知信封' } };
        }
        return envelope.result;
    }
    return {
        call,
        openEventStream(signal) {
            return handler.fetch(new Request('http://in-process.dsh-remote-control/api/events.mux', {
                method: 'GET',
                signal,
            }));
        },
        respond(message) {
            return handler.fetch(new Request('http://in-process.dsh-remote-control/api/respond', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(message),
            })).then((r) => r.json());
        },
    };
}
