// dsh-reasoning-slider —— 5 档思考强度滑块组件
// 改自 flyemFSB/dsh-reasoning-effort-hdbzq 的 ModelEffort.tsx（MIT）：
// 原生 range 语义 + 自绘交互（指针连续跟手、越界弹性回弹、松手吸附提交），
// 档位数按模型 efforts 数组自适应；头像内嵌图片按位置映射（不足时回退名字）。
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { IconCheckOutline16, IconChevronDownOutline14 } from "@deepseek-ai/dsh-client-ui-primitives";
import { EFFORT_ASSETS } from "./assets.generated.js";
import css from "./ModelSlider.module.css";

const TRACK_PAD = 22;

export function ModelSlider({ locked, available, directory, load, select, t }) {
  const state = useSyncExternalStore(
    (fn) => directory.subscribe(fn),
    () => directory.getSnapshot()
  );
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState(null); // 跟手草稿：null = 跟随 store 确认档位
  const [ownPending, setOwnPending] = useState(false);
  const pendingRef = useRef(null);
  const inFlightRef = useRef(false);
  const gestureRef = useRef(false);
  const requestedRef = useRef(-1);
  const inputRef = useRef(null);
  const openedNameRef = useRef(undefined);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const id = useId();

  const rows = useMemo(() => state.groups.flatMap((group) => group.models.map((model) => ({ group, model }))), [state.groups]);
  const selectedIndex =
    state.current === null
      ? -1
      : rows.findIndex((row) => row.group.id === state.current?.provider && row.model.id === state.current?.model);
  const currentRow = rows[selectedIndex];
  const reasoning = currentRow?.model.reasoning;
  const efforts = reasoning?.efforts ?? [];
  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
  const effortIndex = efforts.findIndex((effort) => effort.id === effectiveEffort);
  const committedAsset = EFFORT_ASSETS[effortIndex];
  const effortName =
    reasoning === undefined || efforts.length === 0
      ? undefined
      : committedAsset?.name ?? efforts[effortIndex]?.name ?? (effortIndex < 0 ? effectiveEffort : undefined);
  const modelLabel = currentRow?.model.name ?? t("trigger.fallback");
  const busy = state.status === "selecting";

  const trackPos = (index) => (efforts.length <= 1 ? 0 : (index / (efforts.length - 1)) * 100);
  const displayPos = draft ?? effortIndex;
  const posClamped = Math.min(Math.max(displayPos, 0), Math.max(0, efforts.length - 1));
  const displayIndex = Math.round(posClamped);
  const displayAsset = EFFORT_ASSETS[displayIndex];
  const progress = trackPos(posClamped);
  const knobPos = trackPos(displayPos);
  const effortNameAt = (index) => EFFORT_ASSETS[index]?.name ?? efforts[index]?.name;

  // 挂载时加载一次；每次展开刷新
  useEffect(() => {
    if (available) load();
  }, [available, load]);

  // 外点与 Escape 关闭
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (gestureRef.current) return;
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape" && rootRef.current?.contains(document.activeElement)) {
        setOpen(false);
        queueMicrotask(() => triggerRef.current?.focus());
      }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const settleSelection = (accepted) => {
    inFlightRef.current = false;
    if (!accepted) {
      requestedRef.current = -1;
      setError(directory.getSnapshot().error ?? t("error.rejected"));
    }
  };

  const commitEffort = (index) => {
    const effort = efforts[index];
    if (effort === undefined || state.current === null) return;
    inFlightRef.current = true;
    requestedRef.current = index;
    setOwnPending(true);
    setError(null);
    void select({
      provider: state.current.provider,
      model: state.current.model,
      reasoningEffort: effort.id
    }).then(settleSelection);
  };

  // 非手势路径（键盘、点轨）：即时跟手 + 幂等去重 + 在途合并
  const chooseEffort = (index) => {
    if (efforts[index] === undefined || state.current === null) return;
    if (busy && !ownPending) return;
    setDraft(index);
    if (index === requestedRef.current) return;
    if (inFlightRef.current) {
      pendingRef.current = index;
      return;
    }
    commitEffort(index);
  };

  // 指针手势
  const startGesture = (event) => {
    event.preventDefault();
    gestureRef.current = true;
    setDragging(true);
    event.currentTarget.focus();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    moveTo(event.clientX);
  };

  const moveTo = (clientX) => {
    const input = inputRef.current;
    if (input === null) return;
    const rect = input.getBoundingClientRect();
    const max = Math.max(0, efforts.length - 1);
    const trackW = Math.max(1, rect.width - TRACK_PAD * 2);
    const raw = ((clientX - rect.left - TRACK_PAD) / trackW) * max;
    if (!Number.isFinite(raw)) return;
    const rubber = raw < 0 ? raw * 0.25 : raw > max ? max + (raw - max) * 0.25 : raw;
    const edge = (TRACK_PAD / trackW) * max;
    const pos = Math.min(Math.max(rubber, -edge), max + edge);
    setDraft(pos);
    input.value = String(Math.min(Math.max(Math.round(raw), 0), max));
  };

  const endGesture = () => {
    gestureRef.current = false;
    setDragging(false);
    const max = Math.max(0, efforts.length - 1);
    const target = Math.min(Math.max(Math.round(draft ?? effortIndex), 0), max);
    setDraft(target);
    chooseEffort(target);
  };

  // 提交落地后清在途标记；积压档位续传
  useEffect(() => {
    if (!ownPending || busy) return;
    setOwnPending(false);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending !== null && pending !== effortIndex) commitEffort(pending);
  }, [ownPending, busy, effortIndex]);

  // 草稿收敛：不拖动且无在途时，草稿偏离确认值 → 回到确认值（CSS 回弹）
  useEffect(() => {
    if (dragging || ownPending || draft === null || draft === effortIndex) return;
    setDraft(null);
  }, [dragging, ownPending, draft, effortIndex]);

  // 非受控 input value 同步
  useEffect(() => {
    if (gestureRef.current) return;
    const input = inputRef.current;
    if (input === null) return;
    const target = String(Math.max(Math.round(draft ?? effortIndex), 0));
    if (input.value !== target) input.value = target;
  }, [draft, effortIndex]);

  // 换模型后复位提交去重
  useEffect(() => {
    requestedRef.current = -1;
  }, [state.current?.model]);

  if (!available) return null;

  const show = () => {
    setError(null);
    setOpen(true);
    load();
    openedNameRef.current = effortName;
  };

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus());
  };

  const chooseModel = (index) => {
    const row = rows[index];
    if (row === undefined) return;
    setError(null);
    if (state.current?.provider === row.group.id && state.current.model === row.model.id) {
      close(true);
      return;
    }
    void select({ provider: row.group.id, model: row.model.id }).then((accepted) => {
      settleSelection(accepted);
      if (accepted) close(true);
    });
  };

  const moveFocus = (offset) => {
    const items = itemRefs.current.filter((item) => item !== null);
    if (items.length === 0) return;
    const active = items.findIndex((item) => item === document.activeElement);
    const next = (Math.max(active, 0) + offset + items.length) % items.length;
    items[next]?.focus();
  };

  const onModelListKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    moveFocus(event.key === "ArrowDown" ? 1 : -1);
  };

  const triggerLabel = effortName === undefined ? modelLabel : `${modelLabel} · ${effortName}`;
  const triggerAria =
    currentRow === undefined
      ? t("trigger.selectAria")
      : effortName === undefined
        ? t("trigger.aria", { model: modelLabel })
        : t("trigger.ariaEffort", { model: modelLabel, effort: effortName });

  itemRefs.current = [];
  let itemIndex = 0;
  const itemRef = () => {
    const at = itemIndex++;
    return (node) => {
      itemRefs.current[at] = node;
    };
  };

  return (
    <div ref={rootRef} className={css.root}>
      <button
        ref={triggerRef}
        type="button"
        className={css.trigger}
        aria-label={triggerAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        title={triggerLabel}
        disabled={locked}
        onClick={() => {
          if (open) close();
          else show();
        }}
      >
        {committedAsset !== undefined && <img className={css.triggerAvatar} src={committedAsset.src} alt="" />}
        <span className={css.triggerLabel}>{modelLabel}</span>
        {(open ? openedNameRef.current : effortName) !== undefined && (
          <span className={css.triggerEffort}>{open ? openedNameRef.current : effortName}</span>
        )}
        <IconChevronDownOutline14 className={`${css.chevron} ${open ? css.chevronOpen : ""}`} />
      </button>

      {open && (
        <div id={`${id}-panel`} className={css.panel} role="dialog" aria-label={t("panel.aria")}>
          <div className={css.sectionTitle}>{t("panel.model")}</div>
          {state.status === "loading" && rows.length === 0 && <div className={css.status}>{t("status.loading")}</div>}
          <div role="menu" aria-label={t("panel.model")} className={css.modelList} onKeyDown={onModelListKeyDown}>
            {rows.map((row, index) => {
              const selected = index === selectedIndex;
              return (
                <button
                  key={`${row.group.id}/${row.model.id}`}
                  ref={itemRef()}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={`${css.modelRow} ${selected ? css.modelRowSelected : ""}`}
                  disabled={busy}
                  onClick={() => chooseModel(index)}
                >
                  <span className={css.modelCopy}>
                    <span className={css.modelName}>{row.model.name}</span>
                    <span className={css.modelGroup}>{row.group.name}</span>
                  </span>
                  {selected && <IconCheckOutline16 className={css.check} />}
                </button>
              );
            })}
            {state.failures.map((failure) => (
              <div key={failure.id} className={css.warning}>
                <span>{t("warning.groupLoad", { name: failure.name, message: failure.message })}</span>
              </div>
            ))}
            {state.status === "ready" && rows.length === 0 && <div className={css.status}>{t("empty.models")}</div>}
          </div>

          <div className={css.sectionTitle}>{t("panel.effort")}</div>
          {efforts.length > 0 ? (
            <div className={css.effortBar}>
              <div className={`${css.trackWrap} ${dragging ? css.trackWrapDragging : ""}`}>
                <div className={css.track} aria-hidden="true">
                  <div className={css.trackFill} style={{ width: `${progress}%` }} />
                  {efforts.map((_, index) => (
                    <span
                      key={index}
                      className={`${css.tick} ${index <= displayIndex ? css.tickActive : ""}`}
                      style={{ left: `${trackPos(index)}%` }}
                    />
                  ))}
                  {efforts.map((_, index) =>
                    index > 0 && index <= displayIndex ? (
                      <span key={index} className={css.spark} style={{ left: `${trackPos(index)}%` }} />
                    ) : null
                  )}
                </div>
                <div
                  className={`${css.knob} ${dragging ? css.knobDragging : ""}`}
                  style={{
                    left: `calc(${TRACK_PAD}px + (100% - ${TRACK_PAD * 2}px) * ${knobPos} / 100)`,
                    "--thumb-image": displayAsset !== undefined ? `url("${displayAsset.src}")` : "none"
                  }}
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="range"
                  className={css.range}
                  min={0}
                  max={Math.max(0, efforts.length - 1)}
                  step={1}
                  defaultValue={String(Math.max(effortIndex, 0))}
                  disabled={(busy && !ownPending) || efforts.length <= 1}
                  aria-label={t("panel.effort")}
                  aria-valuetext={effortNameAt(displayIndex)}
                  onPointerDown={startGesture}
                  onPointerMove={(event) => {
                    if (gestureRef.current) moveTo(event.clientX);
                  }}
                  onPointerUp={endGesture}
                  onPointerCancel={endGesture}
                  onLostPointerCapture={endGesture}
                  onChange={(event) => {
                    if (gestureRef.current) return;
                    chooseEffort(Math.round(Number(event.currentTarget.value)));
                  }}
                />
              </div>
              <div className={css.stops} aria-hidden="true">
                {efforts.map((effort, index) => {
                  const stop = EFFORT_ASSETS[index];
                  const active = index === displayIndex;
                  return (
                    <span
                      key={effort.id}
                      className={`${css.stop} ${active ? css.stopActive : ""}`}
                      style={{ left: `calc(${TRACK_PAD}px + (100% - ${TRACK_PAD * 2}px) * ${trackPos(index)} / 100)` }}
                    >
                      {stop !== undefined && <img className={css.stopAvatar} src={stop.src} alt="" />}
                      <span className={css.stopName}>{stop?.name ?? effort.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={css.status}>{t("empty.efforts")}</div>
          )}

          {(error ?? state.error) !== null && (
            <div className={css.error} role="alert">
              <span>{error ?? state.error}</span>
              {state.error !== null && error === null && (
                <button
                  type="button"
                  className={css.retry}
                  onClick={() => {
                    setError(null);
                    load();
                  }}
                >
                  {t("action.reload")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}