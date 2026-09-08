import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * dsh-remote-control — 「远程控制」设置分区面板。
 *
 * 网关状态与地址展示、生成配对码（二维码 + 数字码）、设备列表与吊销。
 * 数据全部来自 /remote-control/* 管理面（回环围栏内的相对路径 fetch）。
 * 样式沿用官方设置页 DSW CSS 变量，无第三方 UI 依赖（二维码用 qrcode 库）。
 */
import { useCallback, useEffect, useState } from 'react';
// 浏览器入口（纯 canvas 渲染）：qrcode 主入口是 Node 版（fs/zlib/pngjs），
// 打进浏览器 bundle 会让 client 模块系统 require 失败、渲染层启动崩溃。
import QRCode from 'qrcode/lib/browser.js';
async function adminGet(path) {
    const res = await fetch(path, { headers: { accept: 'application/json' } });
    return (await res.json());
}
async function adminPost(path, body) {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body),
    });
    return (await res.json());
}
const sectionStyle = {
    width: '100%',
    maxWidth: 760,
    color: 'var(--dsw-alias-label-primary)',
    flexDirection: 'column',
    gap: 14,
    display: 'flex',
};
const headingStyle = { margin: 0, fontSize: 18, fontWeight: 600 };
const textStyle = { margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--dsw-alias-label-tertiary)' };
const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' };
const badgeStyle = (on) => ({
    fontSize: 12,
    padding: '2px 10px',
    borderRadius: 999,
    background: on
        ? 'color-mix(in srgb, var(--dsw-alias-state-success-primary, #3fb27f) 16%, transparent)'
        : 'var(--dsw-alias-bg-module-platform)',
    color: on ? 'var(--dsw-alias-state-success-primary, #3fb27f)' : 'var(--dsw-alias-label-tertiary)',
});
const cardStyle = {
    border: '1px solid var(--dsw-alias-border-secondary, #2a2a33)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};
const codeStyle = {
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: 8,
    fontVariantNumeric: 'tabular-nums',
};
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13 };
const buttonStyle = {
    padding: '7px 16px',
    fontSize: 13,
    borderRadius: 8,
    border: '1px solid var(--dsw-alias-border-secondary, #3a3a44)',
    background: 'var(--dsw-alias-bg-module-platform)',
    color: 'var(--dsw-alias-label-primary)',
    cursor: 'pointer',
};
const dangerStyle = { ...buttonStyle, color: 'var(--dsw-alias-state-danger-primary, #ff7a7a)' };
/** Paired-device glyph: inherits the surrounding label colour. */
function PhoneIcon() {
    return (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { flexShrink: 0, opacity: 0.75 }, children: [_jsx("rect", { x: "6", y: "2.5", width: "12", height: "19", rx: "2.5" }), _jsx("path", { d: "M10.5 18.5h3" })] }));
}
/** 相对时间展示（最近活跃）。 */
function relativeTime(iso, t) {
    const at = new Date(iso).getTime();
    if (Number.isNaN(at))
        return iso;
    const minutes = Math.max(0, Math.round((Date.now() - at) / 60_000));
    if (minutes < 1)
        return t('justNow');
    if (minutes < 60)
        return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours} h`;
    return new Date(iso).toLocaleString();
}
export function Panel({ t }) {
    const [status, setStatus] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [pair, setPair] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [devices, setDevices] = useState([]);
    const refresh = useCallback(async () => {
        try {
            const envelope = await adminGet('/remote-control/status');
            if (envelope.ok && envelope.status !== undefined) {
                setStatus(envelope.status);
                setDevices(envelope.status.devices);
                setLoadError(false);
            }
            else {
                setLoadError(true);
            }
        }
        catch {
            setLoadError(true);
        }
    }, []);
    useEffect(() => { void refresh(); }, [refresh]);
    // 配对码内容变化时重画二维码。
    useEffect(() => {
        if (pair === null || pair.urls.length === 0) {
            setQrDataUrl('');
            return;
        }
        let cancelled = false;
        void QRCode.toDataURL(pair.urls[0], { width: 220, margin: 1, color: { dark: '#101014', light: '#ffffff' } })
            .then((url) => { if (!cancelled)
            setQrDataUrl(url); })
            .catch(() => { if (!cancelled)
            setQrDataUrl(''); });
        return () => { cancelled = true; };
    }, [pair]);
    const issueCode = useCallback(async () => {
        setIssuing(true);
        try {
            const envelope = await adminPost('/remote-control/pair-code', {});
            if (envelope.ok && envelope.code !== undefined) {
                setPair({ code: envelope.code, expiresAt: envelope.expiresAt ?? '', urls: envelope.urls ?? [] });
            }
        }
        finally {
            setIssuing(false);
        }
    }, []);
    const revoke = useCallback(async (id) => {
        if (!window.confirm(t('confirmRevoke')))
            return;
        const envelope = await adminPost('/remote-control/revoke', { id });
        if (envelope.ok) {
            setDevices((current) => current.filter((device) => device.id !== id));
        }
    }, [t]);
    const listening = status?.listening === true;
    return (_jsxs("div", { style: sectionStyle, children: [_jsx("h2", { style: headingStyle, children: t('title') }), _jsx("p", { style: textStyle, children: t('intro') }), _jsxs("div", { style: cardStyle, children: [_jsxs("div", { style: rowStyle, children: [_jsx("strong", { children: t('gatewayLabel') }), _jsx("span", { style: badgeStyle(listening), children: listening ? t('gatewayOn') : t('gatewayOff') }), listening && _jsxs("span", { style: textStyle, children: [t('portLabel'), " ", status?.port] }), _jsx("button", { type: "button", style: { ...buttonStyle, marginLeft: 'auto' }, onClick: () => { void refresh(); }, children: t('refresh') })] }), loadError && _jsx("p", { style: { ...textStyle, color: 'var(--dsw-alias-state-danger-primary, #ff7a7a)' }, children: t('loadError') }), !loadError && status !== null && status.urls.length > 0 && (_jsxs("div", { children: [_jsx("p", { style: textStyle, children: t('addressLabel') }), status.urls.map((url) => (_jsx("p", { style: { ...monoStyle, margin: '2px 0' }, children: url }, url)))] })), !loadError && status !== null && status.urls.length === 0 && listening && (_jsx("p", { style: textStyle, children: t('noAddress') }))] }), _jsxs("div", { style: cardStyle, children: [_jsxs("div", { style: rowStyle, children: [_jsx("strong", { children: t('pairCodeLabel') }), _jsx("button", { type: "button", style: { ...buttonStyle, marginLeft: 'auto' }, disabled: issuing, onClick: () => { void issueCode(); }, children: issuing ? t('issuing') : t('issuePairCode') })] }), pair !== null && (_jsxs(_Fragment, { children: [_jsxs("div", { style: rowStyle, children: [_jsx("span", { style: codeStyle, children: pair.code }), qrDataUrl !== '' && (_jsx("img", { src: qrDataUrl, alt: "QR", width: 110, height: 110, style: { borderRadius: 8, marginLeft: 'auto' } }))] }), _jsx("p", { style: textStyle, children: status?.publicUrl !== undefined && status.publicUrl !== '' ? t('scanHintPublic') : t('scanHint') }), _jsxs("p", { style: textStyle, children: [t('pairCodeExpires'), ": ", new Date(pair.expiresAt).toLocaleTimeString()] })] }))] }), _jsxs("div", { style: cardStyle, children: [_jsx("strong", { children: t('devicesLabel') }), devices.length === 0 && _jsx("p", { style: textStyle, children: t('noDevices') }), devices.map((device) => (_jsxs("div", { style: { ...rowStyle, borderBottom: '1px solid var(--dsw-alias-border-secondary, #23232b)', paddingBottom: 8 }, children: [_jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: 6 }, children: [_jsx(PhoneIcon, {}), device.name] }), _jsxs("span", { style: textStyle, children: [t('lastSeen'), " ", relativeTime(device.lastSeen, t)] }), _jsx("button", { type: "button", style: { ...dangerStyle, marginLeft: 'auto' }, onClick: () => { void revoke(device.id); }, children: t('revoke') })] }, device.id)))] }), _jsx("p", { style: textStyle, children: t('securityNote') })] }));
}
