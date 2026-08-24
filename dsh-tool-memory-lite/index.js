// dsh-tool-memory-lite —— 极简记忆插件
// 触发：显式调用（模型只在用户要求记录时调用），默认零写入。
// 存储：$DSH_HOME/memory/
//   projects/<项目名>.md   项目记忆（按条目标题覆盖更新）
//   knowledge/<主题>.md    全局知识（按条目标题覆盖更新）
//   journal/<YYYY-MM-DD>.md 每日流水（追加）
// 依赖：无（仅 node:fs），直接使用 ctx.tools.register。

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const name = 'tool-memory-lite';
const inject = ['tools'];

function resolveRoot(config) {
  if (config && config.root) return config.root;
  if (process.env.DSH_HOME) return process.env.DSH_HOME;
  return path.join(os.homedir(), '.dsh');
}

const SCOPE_DIR = { project: 'projects', knowledge: 'knowledge', journal: 'journal' };

function pad(n) {
  return String(n).padStart(2, '0');
}

function nowStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function today() {
  return nowStamp().slice(0, 10);
}

function journalKey(key) {
  const value = key === undefined || key === null || String(key).trim() === '' ? today() : String(key).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('journal key must use YYYY-MM-DD');
  return value;
}

function requiredKey(scope, key) {
  const value = String(key ?? '').trim();
  if (value === '') throw new Error(`${scope} memory requires a key`);
  return value;
}

function scopePath(root, scope, key) {
  const subdir = SCOPE_DIR[scope];
  if (subdir === undefined) throw new Error(`unsupported memory scope: ${String(scope)}`);
  const dir = path.join(root, 'memory', subdir);
  if (scope === 'journal') return { dir, file: path.join(dir, `${journalKey(key)}.md`) };
  const safe = requiredKey(scope, key).replace(/[\\/:*?"<>|]/g, '_').trim() || 'untitled';
  return { dir, file: path.join(dir, `${safe}.md`) };
}

async function withFileLock(file, operation) {
  const lock = `${file}.lock`;
  const deadline = Date.now() + 10000;
  while (true) {
    try {
      const handle = await fs.promises.open(lock, 'wx');
      try {
        await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: Date.now() }), 'utf8');
        return await operation();
      } finally {
        await handle.close();
        await fs.promises.rm(lock, { force: true });
      }
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      try {
        const stat = await fs.promises.stat(lock);
        if (Date.now() - stat.mtimeMs > 30000) {
          await fs.promises.rm(lock, { force: true });
          continue;
        }
      } catch (statError) {
        if (statError?.code === 'ENOENT') continue;
        throw statError;
      }
      if (Date.now() >= deadline) throw new Error(`memory file is busy: ${file}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

async function writeAtomic(file, text) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.promises.writeFile(temp, text, 'utf8');
    await fs.promises.rename(temp, file);
  } catch (error) {
    await fs.promises.rm(temp, { force: true });
    throw error;
  }
}

// 在 markdown 文本中按 "## 标题" 块覆盖更新；不存在则追加。
function upsertBlock(text, title, block) {
  const lines = text.split('\n');
  const startIdx = lines.findIndex((l) => l.startsWith('## ') && l.slice(3).trim() === title);
  if (startIdx === -1) {
    return text.replace(/\n*$/, '\n') + block + '\n';
  }
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
  }
  const before = lines.slice(0, startIdx).join('\n');
  const after = lines.slice(endIdx).join('\n');
  return (before ? before + '\n' : '') + block + '\n' + after;
}

function removeBlock(text, title) {
  const lines = text.split('\n');
  const startIdx = lines.findIndex((l) => l.startsWith('## ') && l.slice(3).trim() === title);
  if (startIdx === -1) return { text, removed: false };
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
  }
  const before = lines.slice(0, startIdx).join('\n');
  const after = lines.slice(endIdx).join('\n');
  return { text: (before ? before + '\n' : '') + after, removed: true };
}

// Convert the flat per-property parameter spec to the raw JSON Schema the LLM
// providers expect ({ type:'object', properties, required? }), mirroring
// dsh-tools' parameterSchemaSpecToJsonSchema. Without this the flat form is
// passed through verbatim and providers reject it with a 400 invalid schema.
function toParameterSchema(spec) {
  const properties = {};
  const required = [];
  for (const [key, def] of Object.entries(spec)) {
    const { required: isRequired, ...rest } = def;
    properties[key] = rest;
    if (isRequired) required.push(key);
  }
  return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) };
}

function apply(ctx, config) {
  const root = resolveRoot(config);

  ctx.tools.register({
    name: 'memory_save',
    description: 'Save a memory entry under DSH_HOME/memory: project, knowledge, or journal.',
    parameters: toParameterSchema({
      scope: { type: 'string', required: true, enum: ['project', 'knowledge', 'journal'], description: '记忆类别：project=项目记忆，knowledge=全局知识，journal=每日流水' },
      key: { type: 'string', description: '项目名 / 主题名；journal 可省略，默认使用当天日期，也可传 YYYY-MM-DD' },
      content: { type: 'string', required: true, description: '要保存的总结内容（markdown 文本）' },
      title: { type: 'string', description: '条目标题（project/knowledge 用；同标题=覆盖更新，默认取内容首行）' },
      mode: { type: 'string', enum: ['merge', 'replace-document'], description: 'project/knowledge 写入模式：默认 merge；整份多章节文档必须显式使用 replace-document' }
    }),
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'action'],
        properties: {
          file: { type: 'string' },
          action: { type: 'string' }
        }
      },
      render: (_args, value) => [{ type: 'text', text: `记忆已${value.action}：${value.file}` }]
    },
    async execute(args) {
      const scope = args.scope;
      const { dir, file } = scopePath(root, scope, args.key);
      await fs.promises.mkdir(dir, { recursive: true });
      const stamp = nowStamp();

      return withFileLock(file, async () => {
        if (scope === 'journal') {
          const existed = fs.existsSync(file);
          const block = `- ${stamp} ${args.content.replace(/\n/g, '\n  ')}\n`;
          await fs.promises.appendFile(file, block, 'utf8');
          return { file, action: existed ? 'appended' : 'created' };
        }

        const existed = fs.existsSync(file);
        const text = existed ? await fs.promises.readFile(file, 'utf8') : '';
        const contentLines = args.content.trim().split('\n');
        const multiBlockDocument = contentLines[0]?.startsWith('## ') && contentLines.slice(1).some((line) => line.startsWith('## '));
        if (multiBlockDocument && args.mode !== 'replace-document') {
          throw new Error('multi-section documents require mode="replace-document"');
        }
        const title = (args.title || args.content.split('\n')[0] || '记录').trim().slice(0, 80);
        const block = `## ${title}\n- 更新时间: ${stamp}\n- 类别: ${scope === 'project' ? '项目' : '知识'}\n\n${args.content.trim()}`;
        if (args.mode === 'replace-document') {
          await writeAtomic(file, args.content.trim() + '\n');
          return { file, action: existed ? 'updated' : 'created' };
        }
        const next = upsertBlock(text, title, block);
        const updated = next !== text;
        await writeAtomic(file, next);
        return { file, action: !existed ? 'created' : updated ? 'updated' : 'unchanged' };
      });
    },
    presentCall: (args) => ({ card: 'generic', title: '保存记忆', kind: 'other', rawInput: `${args.scope}/${args.key}` })
  });

  ctx.tools.register({
    name: 'memory_read',
    description: 'Read a memory entry under DSH_HOME/memory by scope and key.',
    parameters: toParameterSchema({
      scope: { type: 'string', required: true, enum: ['project', 'knowledge', 'journal'], description: '记忆类别' },
      key: { type: 'string', required: true, description: '项目名 / 主题名 / 日期(YYYY-MM-DD，journal用，缺省读最近一天)' }
    }),
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: {
          text: { type: 'string' },
          file: { type: 'string' }
        }
      },
      render: (_args, value) => [{ type: 'text', text: value.text }]
    },
    execute(args) {
      const scope = args.scope;
      const dir = path.join(root, 'memory', SCOPE_DIR[scope]);
      if (!fs.existsSync(dir)) return { text: '（该类别暂无记忆）' };
      if (scope === 'journal') {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().reverse();
        if (files.length === 0) return { text: '（暂无每日流水）' };
        const target = args.key ? `${args.key}.md` : files[0];
        const full = path.join(dir, target);
        if (!fs.existsSync(full)) return { text: `（没有 ${args.key} 的流水）` };
        return { text: fs.readFileSync(full, 'utf8'), file: full };
      }
      const safe = String(args.key).replace(/[\\/:*?"<>|]/g, '_').trim();
      const full = path.join(dir, `${safe}.md`);
      if (!fs.existsSync(full)) return { text: `（记忆不存在：${args.scope}/${args.key}）` };
      return { text: fs.readFileSync(full, 'utf8'), file: full };
    },
    presentCall: (args) => ({ card: 'generic', title: '读取记忆', kind: 'other', rawInput: `${args.scope}/${args.key}` })
  });

  ctx.tools.register({
    name: 'memory_list',
    description: 'List memory documents (and their entry titles) under a scope: project, knowledge, or journal.',
    parameters: toParameterSchema({
      scope: { type: 'string', required: true, enum: ['project', 'knowledge', 'journal'], description: '记忆类别' }
    }),
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: {
          text: { type: 'string' }
        }
      },
      render: (_args, value) => [{ type: 'text', text: value.text }]
    },
    execute(args) {
      const dir = path.join(root, 'memory', SCOPE_DIR[args.scope]);
      if (!fs.existsSync(dir)) return { text: '（该类别暂无记忆）' };
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
      if (files.length === 0) return { text: '（该类别暂无记忆）' };
      const lines = files.map((f) => {
        const full = path.join(dir, f);
        const text = fs.readFileSync(full, 'utf8');
        const titles = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
        return `- ${f}${titles.length ? `  [条目: ${titles.join(' | ')}]` : ''}`;
      });
      return { text: lines.join('\n') };
    },
    presentCall: (args) => ({ card: 'generic', title: '列出记忆', kind: 'other', rawInput: args.scope })
  });

  ctx.tools.register({
    name: 'memory_forget',
    description: 'Delete a memory entry (or one titled block) under DSH_HOME/memory.',
    parameters: toParameterSchema({
      scope: { type: 'string', required: true, enum: ['project', 'knowledge', 'journal'], description: '记忆类别' },
      key: { type: 'string', required: true, description: '项目名 / 主题名 / 日期' },
      title: { type: 'string', description: '条目标题（只删这一条；不传则删除整个文档）' }
    }),
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: {
          text: { type: 'string' }
        }
      },
      render: (_args, value) => [{ type: 'text', text: value.text }]
    },
    execute(args) {
      const scope = args.scope;
      const { dir, file } = scopePath(root, scope, args.key);
      if (!fs.existsSync(file)) return { text: `（记忆不存在：${args.scope}/${args.key}）` };
      if (args.title && scope !== 'journal') {
        const text = fs.readFileSync(file, 'utf8');
        const { text: next, removed } = removeBlock(text, args.title);
        if (!removed) return { text: `（未找到条目：${args.title}）` };
        fs.writeFileSync(file, next.trim() ? next : '', 'utf8');
        if (!next.trim()) fs.unlinkSync(file);
        return { text: `已删除条目「${args.title}」：${file}` };
      }
      fs.unlinkSync(file);
      return { text: `已删除记忆：${file}` };
    },
    presentCall: (args) => ({ card: 'generic', title: '删除记忆', kind: 'other', rawInput: `${args.scope}/${args.key}` })
  });
}

export { name, apply, inject };
