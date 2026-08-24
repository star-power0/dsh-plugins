// dsh-session-manager —— host 端（node）
// 提供会话删除能力（DSH 原版只支持归档）：
//   - 通过 workspaceRegistry 正式解除会话归属（持久化）
//   - 删除会话数据目录（sessions/<ws>/session-<uuid>/）
//   - 清理 session_projcache 中的条目
// 暴露 HTTP 端点供 client 端「会话管理」设置页调用：
//   GET  /session-manager/list   列出所有工作区与会话（标题/时间/轮数）
//   POST /session-manager/delete 删除一个会话 {sessionId}
import { readFile, writeFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const name = "session-manager";
const inject = ["workspaceRegistry", "webServer"];

function apply(ctx, config = {}) {
  // Cordis 4 通过第二个参数传入插件配置（ctx.config 在某些上下文不可用）
  const root = config.root ?? process.env.DSH_HOME ?? path.join(os.homedir(), ".dsh");
  const sessionsRoot = path.join(root, "sessions");
  const projCacheFile = path.join(root, "storages", "session_projcache.json");
  const workspaceFile = path.join(root, "storages", "workspace.json");
  const deletedSessionsFile = path.join(root, "storages", "session_manager_deleted.json");

  async function readJson(file) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      return null;
    }
  }
  async function writeJson(file, data) {
    await writeFile(file, JSON.stringify(data, null, 2), "utf8");
  }

  async function deletedSessionIds() {
    const deleted = await readJson(deletedSessionsFile);
    return new Set(Array.isArray(deleted?.sessionIds) ? deleted.sessionIds : []);
  }

  async function markSessionDeleted(sessionId) {
    const deleted = await deletedSessionIds();
    if (deleted.has(sessionId)) return;
    deleted.add(sessionId);
    await writeJson(deletedSessionsFile, { sessionIds: [...deleted] });
  }

  /** 在 sessions/ 下按 sessionId 定位数据目录（路径编码未知，全盘找）。 */
  async function findSessionDir(sessionId) {
    let workspaces;
    try {
      workspaces = await readdir(sessionsRoot, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const ws of workspaces) {
      if (!ws.isDirectory()) continue;
      const wsDir = path.join(sessionsRoot, ws.name);
      let entries;
      try {
        entries = await readdir(wsDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        if (e.isDirectory() && e.name === sessionId) return path.join(wsDir, e.name);
      }
    }
    return null;
  }

  async function pruneOrphanProjectionEntries(proj, registry) {
    const sessions = proj?.tables?.sessions;
    if (!sessions) return [];
    const accounted = new Set([
      ...registry.list().flatMap((entity) => entity.sessionIds),
      ...registry.archivedSessionIds
    ]);
    const removed = [];
    for (const sessionId of Object.keys(sessions)) {
      if (accounted.has(sessionId)) continue;
      if (await findSessionDir(sessionId)) continue;
      delete sessions[sessionId];
      removed.push(sessionId);
    }
    if (removed.length > 0) await writeJson(projCacheFile, proj);
    return removed;
  }

  /** 组装会话列表（client 端渲染用）。 */
  async function list() {
    const registry = ctx.workspaceRegistry;
    const deleted = await deletedSessionIds();
    const proj = await readJson(projCacheFile);
    await pruneOrphanProjectionEntries(proj, registry);
    const sessions = proj?.tables?.sessions ?? {};
    const workspaces = registry.list().map((entity) => ({
      workspaceId: entity.id,
      path: entity.record.path,
      title: entity.record.title,
      sessions: entity.sessionIds.filter((sessionId) => !deleted.has(sessionId)).map((sessionId) => {
        const p = sessions[sessionId];
        return {
          sessionId,
          title: p?.rows?.title?.val ?? "(无标题)",
          createdAt: p?.identity?.createdAt ?? null,
          turns: p?.rows?.sessionStats?.val?.turns ?? 0
        };
      })
    }));
    return {
      workspaces,
      archived: [...registry.archivedSessionIds]
    };
  }

  /** 彻底删除一个会话。 */
  async function removeSession(sessionId) {
    await markSessionDeleted(sessionId);
    const registry = ctx.workspaceRegistry;
    let detached = false;
    for (const entity of registry.list()) {
      if (entity.sessionIds.includes(sessionId)) {
        await entity.detachSession(sessionId);
        detached = true;
      }
    }
    const dir = await findSessionDir(sessionId);
    if (dir) await rm(dir, { recursive: true, force: true });
    const workspace = await readJson(workspaceFile);
    if (Array.isArray(workspace?.global?.archivedSessionIds)) {
      const archivedSessionIds = workspace.global.archivedSessionIds.filter((id) => id !== sessionId);
      if (archivedSessionIds.length !== workspace.global.archivedSessionIds.length) {
        workspace.global.archivedSessionIds = archivedSessionIds;
        await writeJson(workspaceFile, workspace);
      }
    }
    const proj = await readJson(projCacheFile);
    if (proj?.tables?.sessions?.[sessionId]) {
      delete proj.tables.sessions[sessionId];
      await writeJson(projCacheFile, proj);
    }
    return { ok: true, detached, removedDir: dir !== null };
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "prefix",
        path: "/session-manager",
        handler: async (req, res) => {
          const url = new URL(req.url ?? "/", "http://x");
          const send = (code, body) => {
            res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
            res.end(JSON.stringify(body));
          };
          try {
            if (req.method === "GET" && url.pathname === "/session-manager/list") {
              send(200, await list());
            } else if (req.method === "POST" && url.pathname === "/session-manager/delete") {
              let bodyText = "";
              for await (const chunk of req) bodyText += chunk;
              let body;
              try {
                body = JSON.parse(bodyText || "{}");
              } catch {
                send(400, { ok: false, error: "invalid json body" });
                return;
              }
              const sessionId = body.sessionId;
              if (typeof sessionId !== "string" || sessionId.length === 0) {
                send(400, { ok: false, error: "missing sessionId" });
                return;
              }
              send(200, await removeSession(sessionId));
            } else {
              send(404, { ok: false, error: "not found" });
            }
          } catch (error) {
            send(500, { ok: false, error: error instanceof Error ? error.message : String(error) });
          }
        }
      }),
    "session-manager: routes"
  );
}

export { name, apply, inject };
