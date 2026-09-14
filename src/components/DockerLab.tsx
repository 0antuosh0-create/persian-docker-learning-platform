import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronLeft, CircleDashed, Copy, Database,
  FlaskConical, Lightbulb, Lock, PartyPopper, RotateCcw,
  Sparkles, Target, Terminal, Trophy, UserRound, Zap,
} from "lucide-react";
import { missions as rawMissions } from "../data/lab";
import type { Mission } from "../data/lab";

/* ترتیب نمایش همیشه بر اساس order است، نه ترتیب تعریف در فایل */
const missions = [...rawMissions].sort((a, b) => a.order - b.order);
import { runCommand } from "../lib/dockerSim";
import type { LabState, OutLine } from "../lib/dockerSim";
import { Inline } from "./StepBlocks";
import "./DockerLab.css";

const fa = (n: number) => n.toLocaleString("fa-IR");
const LAB_KEY = "bandar-docker-lab-v1";
const ACTIVE_KEY = "bandar-docker-lab-active-v1";

type Block = { id: number; input?: string; lines: OutLine[]; toast?: boolean };

/* پرامپت ترمینال — هویت ثابت همه ترمینال‌های سایت */
export function TermPrompt({ host = "docker-lab" }: { host?: string }) {
  return (
    <span className="term-prompt" dir="ltr">
      <span className="tp-user">user@{host}</span>
      <span className="tp-sep">:</span>
      <span className="tp-path">~</span>
      <span className="tp-dollar">$</span>
    </span>
  );
}

/* ══════════════ مرز خطا — هرگز صفحه خالی نمی‌ماند ══════════════ */
class LabErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[DockerLab] render error:", error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="lab-error" role="alert">
        <div className="lab-error-icon"><AlertTriangle size={26} /></div>
        <h3>آزمایشگاه با خطا مواجه شد</h3>
        <p>مشکلی در بارگذاری این بخش پیش آمد. محیط را بازنشانی کنید تا از نو شروع شود.</p>
        <code dir="ltr">{this.state.error.message}</code>
        <button
          className="lab-error-btn"
          onClick={() => { this.setState({ error: null }); this.props.onReset(); }}
        >
          <RotateCcw size={15} /> بازنشانی آزمایشگاه
        </button>
      </div>
    );
  }
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

/* ══════════════ ورودی اصلی آزمایشگاه ══════════════ */
export function DockerLab({ onBack }: { onBack: () => void }) {
  const [doneMissions, setDoneMissions] = useState<string[]>(() => {
    const v = readJSON<unknown>(LAB_KEY, []);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  });
  /* ماموریت فعال ماندگار می‌ماند تا با رفرش یا رفت‌وبرگشت گم نشود */
  const [activeId, setActiveIdRaw] = useState<string | null>(() => {
    const v = readJSON<string | null>(ACTIVE_KEY, null);
    return v && missions.some((m) => m.id === v) ? v : null;
  });
  const setActiveId = useCallback((id: string | null) => {
    setActiveIdRaw(id);
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, JSON.stringify(id));
      else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* حافظه در دسترس نیست — نادیده */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LAB_KEY, JSON.stringify(doneMissions)); } catch { /* ignore */ }
  }, [doneMissions]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [activeId]);

  const mission = missions.find((m) => m.id === activeId) ?? null;

  const isUnlocked = useCallback((m: Mission) => {
    if (m.order === 1) return true;
    const prev = missions.find((x) => x.order === m.order - 1);
    return !prev || doneMissions.includes(prev.id);
  }, [doneMissions]);

  /* اگر ماموریت ذخیره‌شده قفل است (مثلاً پیشرفت پاک شده)، به فهرست برگرد */
  useEffect(() => {
    if (mission && !isUnlocked(mission)) setActiveId(null);
  }, [mission, isUnlocked, setActiveId]);

  const hardReset = useCallback(() => {
    setActiveId(null);
    setDoneMissions([]);
    try { localStorage.removeItem(LAB_KEY); localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
  }, [setActiveId]);

  return (
    <LabErrorBoundary onReset={hardReset}>
      {mission ? (
        <MissionRunner
          key={mission.id}
          mission={mission}
          solved={doneMissions.includes(mission.id)}
          onSolve={() => setDoneMissions((l) => (l.includes(mission.id) ? l : [...l, mission.id]))}
          onExit={() => setActiveId(null)}
          onNext={() => {
            const nxt = missions.find((m) => m.order === mission.order + 1);
            setActiveId(nxt ? nxt.id : null);
          }}
        />
      ) : (
        <MissionList
          doneMissions={doneMissions}
          isUnlocked={isUnlocked}
          onOpen={setActiveId}
          onBack={onBack}
        />
      )}
    </LabErrorBoundary>
  );
}

/* ══════════════ فهرست ماموریت‌ها ══════════════ */
function MissionList({
  doneMissions, isUnlocked, onOpen, onBack,
}: {
  doneMissions: string[]; isUnlocked: (m: Mission) => boolean; onOpen: (id: string) => void; onBack: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const doneCount = doneMissions.length;
  const pct = Math.round((doneCount / missions.length) * 100);
  const next = missions.find((m) => !doneMissions.includes(m.id) && isUnlocked(m));

  return (
    <div className="lab" dir="rtl">
      <header className="lab-topbar">
        <div className="lab-topbar-inner">
          <button className="lab-back" onClick={onBack} aria-label="بازگشت به نقشه دوره">
            <ArrowRight size={19} />
          </button>
          <div className="lab-title">
            <span>بندرِ داکر <i aria-hidden="true">/</i> تمرین عملی</span>
            <strong>آزمایشگاه داکر</strong>
          </div>
          <div className="lab-progress" aria-label={`${fa(pct)} درصد ماموریت‌ها انجام شده`}>
            <div className="lab-progress-track"><span style={{ width: `${pct}%` }} /></div>
            <b>{fa(doneCount)}/{fa(missions.length)}</b>
          </div>
        </div>
      </header>

      <main className="lab-body">
        <motion.section
          className="lab-hero"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
        >
          <div className="lab-hero-copy">
            <div className="lab-hero-badge"><FlaskConical size={15} /> محیط شبیه‌سازی‌شده · بدون نیاز به نصب</div>
            <h1>اینجا فقط نمی‌خوانید — <mark>واقعاً کار می‌کنید</mark></h1>
            <p>
              یک موتور Docker کوچک داخل مرورگر شما اجرا می‌شود: کانتینر می‌سازید، لاگ می‌خوانید، خرابی را پیدا می‌کنید
              و درستش می‌کنید. وضعیت محیط بین دستورها حفظ می‌شود — دقیقاً مثل یک سرور واقعی.
            </p>
            <div className="lab-hero-meta">
              <span><Target size={15} /> {fa(missions.length)} ماموریت واقعی</span>
              <span><Terminal size={15} /> ترمینال با وضعیت زنده</span>
              <span><Sparkles size={15} /> بررسی خودکار اهداف</span>
            </div>
            {next && (
              <button className="lab-continue" onClick={() => onOpen(next.id)}>
                <Zap size={16} />
                {doneCount === 0 ? "شروع اولین ماموریت" : `ادامه: ${next.title}`}
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
          <div className="lab-hero-visual" aria-hidden="true">
            <div className="hv-window">
              <div className="hv-bar"><i /><i /><i /><span>docker@lab</span></div>
              <div className="hv-body">
                <div><b>$</b> docker ps -a</div>
                <div className="hv-dim">CONTAINER ID   IMAGE        STATUS</div>
                <div className="hv-err">b3f1a9c27d84   shop-api     Exited (1)</div>
                <div><b>$</b> docker logs api</div>
                <div className="hv-err">Error: DB_HOST is not defined</div>
                <div><b>$</b> docker run -d -e DB_HOST=db …</div>
                <div className="hv-ok">✔ listening on :3000</div>
                <div className="hv-cursor"><b>$</b><span /></div>
              </div>
            </div>
            <div className="hv-chip hv-chip-1"><CheckCircle2 size={13} /> هدف ۲/۴</div>
            <div className="hv-chip hv-chip-2"><Database size={13} /> pg_data</div>
          </div>
        </motion.section>

        <div className="mission-section-head">
          <h2>ماموریت‌ها</h2>
          <p>به ترتیب باز می‌شوند؛ هر ماموریت روی مهارت ماموریت قبلی ساخته شده است.</p>
        </div>

        <div className="mission-grid">
          {missions.map((m, i) => {
            const done = doneMissions.includes(m.id);
            const unlocked = isUnlocked(m);
            const isNext = next?.id === m.id;
            return (
              <motion.button
                key={m.id}
                className={`mission-card${done ? " done" : ""}${!unlocked ? " locked" : ""}${isNext ? " next" : ""}`}
                onClick={() => unlocked && onOpen(m.id)}
                disabled={!unlocked}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.36, delay: reduceMotion ? 0 : 0.08 + i * 0.05 }}
              >
                <div className="mission-card-top">
                  <span className="mission-no">
                    {done ? <CheckCircle2 size={18} /> : unlocked ? fa(m.order) : <Lock size={14} />}
                  </span>
                  <span className={`mission-level lv${m.level}`}>
                    {["مقدماتی", "متوسط", "پیشرفته"][m.level - 1]}
                  </span>
                </div>
                <h3>{m.title}</h3>
                <p className="mission-role"><UserRound size={13} /> {m.role}</p>
                <p className="mission-teaser">{m.brief[0].replace(/\*\*/g, "")}</p>
                <div className="mission-card-foot">
                  <span>{fa(m.objectives.length)} هدف · حدود {fa(m.minutes)} دقیقه</span>
                  {isNext && <em className="mission-next-tag">بعدی</em>}
                  {unlocked && !isNext && <ChevronLeft size={16} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {doneCount === missions.length && (
          <motion.div className="lab-graduate" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Trophy size={32} />
            <h3>همه ماموریت‌ها انجام شد!</h3>
            <p>شما یک محیط داکر را از صفر راه انداختید، خرابی واقعی را عیب‌یابی کردید، داده را نجات دادید، شبکه ساختید و سرور را تمیز کردید.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ══════════════ اجرای یک ماموریت ══════════════ */
function MissionRunner({
  mission, solved, onSolve, onExit, onNext,
}: {
  mission: Mission; solved: boolean; onSolve: () => void; onExit: () => void; onNext: () => void;
}) {
  const reduceMotion = useReducedMotion();

  /* setup محافظت‌شده: اگر خطا داد، به‌جای کرش، state خالی و پیام روشن */
  const [setupError, setSetupError] = useState<string | null>(null);
  const buildState = useCallback((): LabState => {
    try {
      setSetupError(null);
      return mission.setup();
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : String(e));
      return { images: [], containers: [], volumes: [], networks: [], history: [], seq: 1 };
    }
  }, [mission]);

  const [state, setState] = useState<LabState>(buildState);
  const [blocks, setBlocks] = useState<Block[]>(() => [{
    id: 0,
    lines: [
      { text: `Docker Lab Engine v1.0 — Mission ${mission.order}`, tone: "ok" },
      { text: "Type 'help' for available commands, 'clear' to clear screen.", tone: "dim" },
    ],
  }]);
  const [input, setInput] = useState("");
  const [histIdx, setHistIdx] = useState(-1);
  const [hintsShown, setHintsShown] = useState(0);
  const [justDone, setJustDone] = useState<string[]>([]);
  const [finished, setFinished] = useState(solved);
  const [running, setRunning] = useState(false);
  const [mobileTab, setMobileTab] = useState<"brief" | "terminal">("brief");
  const [phIdx, setPhIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<number | null>(null);

  const copyCmd = (id: number, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd((c) => (c === id ? null : c)), 1400);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(1);
  /* آیا کاربر حداقل یک دستور اجرا کرده؟ برای جلوگیری از نمایش توست اهداف در بارگذاری اولیه */
  const interactedRef = useRef(false);

  const PLACEHOLDERS = ["docker ps -a", "docker images", "docker logs api", "docker volume ls", "help"];
  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 4200);
    return () => clearInterval(t);
  }, []);

  const metIds = useMemo(
    () => mission.objectives.filter((o) => { try { return o.check(state); } catch { return false; } }).map((o) => o.id),
    [mission.objectives, state]
  );
  const allMet = metIds.length === mission.objectives.length;
  const objPct = Math.round((metIds.length / mission.objectives.length) * 100);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [blocks, reduceMotion]);

  /* تکمیل همه اهداف → پایان ماموریت؛ اگر کاربر دستوری زده، کمی صبر کن تا آخرین ✔ دیده شود */
  useEffect(() => {
    if (!allMet || finished) return;
    const t = window.setTimeout(
      () => { setFinished(true); onSolve(); },
      reduceMotion ? 0 : interactedRef.current ? 650 : 0
    );
    return () => clearTimeout(t);
  }, [allMet, finished, onSolve, reduceMotion]);

  const prevMet = useRef<string[]>([]);
  useEffect(() => {
    const fresh = metIds.filter((id) => !prevMet.current.includes(id));
    prevMet.current = metIds;
    if (!fresh.length) return;
    setJustDone(fresh);
    /* توست داخل ترمینال: بازخورد همان‌جایی که کاربر مشغول کار است */
    if (interactedRef.current) {
      setBlocks((b) => [...b, {
        id: seqRef.current++, toast: true,
        lines: fresh.map((id) => {
          const idx = mission.objectives.findIndex((o) => o.id === id);
          return { text: `✔ Objective ${idx >= 0 ? idx + 1 : ""}/${mission.objectives.length} completed!`, tone: "ok" as const };
        }),
      }]);
    }
    const t = setTimeout(() => setJustDone([]), 1400);
    return () => clearTimeout(t);
  }, [metIds, mission.objectives]);

  const submit = useCallback(() => {
    const cmd = input.trim();
    if (!cmd || running) return;
    interactedRef.current = true;
    setRunning(true);

    /* دستور ویژه: وضعیت اهداف را داخل ترمینال چاپ می‌کند */
    if (/^(check|objectives|status)$/i.test(cmd)) {
      const statusLines: OutLine[] = [
        { text: `Objective Status — ${metIds.length}/${mission.objectives.length} completed:`, tone: "dim" },
        ...mission.objectives.map((o, idx) => ({
          text: `  ${metIds.includes(o.id) ? "✔" : "○"} Objective ${idx + 1}/${mission.objectives.length}: ${metIds.includes(o.id) ? "COMPLETED" : "PENDING"}`,
          tone: (metIds.includes(o.id) ? "ok" : undefined) as OutLine["tone"],
        })),
      ];
      setRunning(false);
      setInput("");
      setHistIdx(-1);
      return;
    }

    /* تأخیر کوتاه: حس اجرای واقعی + فرصت رندر وضعیت «در حال اجرا» */
    window.setTimeout(() => {
      try {
        const { out, state: next } = runCommand(state, cmd);
        if (out.length === 1 && out[0].text === "__CLEAR__") setBlocks([]);
        else setBlocks((b) => [...b, { id: seqRef.current++, input: cmd, lines: out }]);
        setState(next);
      } catch (e) {
        setBlocks((b) => [...b, {
          id: seqRef.current++, input: cmd,
          lines: [{ text: `خطای داخلی شبیه‌ساز: ${e instanceof Error ? e.message : String(e)}`, tone: "err" }],
        }]);
      } finally {
        setRunning(false);
        setInput("");
        setHistIdx(-1);
      }
    }, reduceMotion ? 0 : 90);
  }, [input, state, running, reduceMotion, metIds, mission.objectives]);

  /* تکمیل خودکار با Tab — مثل یک ترمینال واقعی */
  const DOCKER_SUBS = ["ps", "images", "run", "pull", "logs", "stop", "start", "rm", "rmi", "exec", "inspect", "volume", "network"];
  const VOLUME_SUBS = ["create", "ls", "rm", "prune", "inspect"];
  const NETWORK_SUBS = ["create", "ls", "rm", "connect", "inspect"];
  const completeTab = () => {
    const v = input;
    if (!v) { setInput("docker "); return; }
    const volMatch = v.match(/^docker\s+volume\s+(\w*)$/);
    if (volMatch) {
      const hit = VOLUME_SUBS.find((s) => s.startsWith(volMatch[1]));
      if (hit) setInput(`docker volume ${hit} `);
      return;
    }
    const netMatch = v.match(/^docker\s+network\s+(\w*)$/);
    if (netMatch) {
      const hit = NETWORK_SUBS.find((s) => s.startsWith(netMatch[1]));
      if (hit) setInput(`docker network ${hit} `);
      return;
    }
    const subMatch = v.match(/^docker\s+(\w*)$/);
    if (subMatch) {
      const hit = DOCKER_SUBS.find((s) => s.startsWith(subMatch[1]));
      if (hit) setInput(`docker ${hit} `);
      return;
    }
    if (/^doc\w*$/.test(v)) setInput("docker ");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); return; }
    if (e.key === "Tab") { e.preventDefault(); completeTab(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = state.history;
      if (!h.length) return;
      const idx = histIdx < 0 ? h.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx); setInput(h[idx]);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = state.history;
      if (histIdx < 0) return;
      const idx = histIdx + 1;
      if (idx >= h.length) { setHistIdx(-1); setInput(""); }
      else { setHistIdx(idx); setInput(h[idx]); }
    }
    if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setBlocks([]); }
    if (e.key === "Escape") { e.currentTarget.blur(); }
  };

  const reset = () => {
    setState(buildState());
    setBlocks([{ id: seqRef.current++, lines: [{ text: "Environment reset to initial state.", tone: "warn" }] }]);
    setInput(""); setHistIdx(-1); prevMet.current = [];
    inputRef.current?.focus();
  };

  const insert = (cmd: string) => {
    setInput(cmd);
    setMobileTab("terminal");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  /* خلاصه زنده محیط: چه چیزهایی الان وجود دارد */
  const runningCount = state.containers.filter((c) => c.status === "running").length;
  const exitedCount = state.containers.length - runningCount;
  const customNets = state.networks.filter((n) => !n.builtin).length;

  return (
    <div className="lab lab-mission" dir="rtl">
      <header className="lab-topbar">
        <div className="lab-topbar-inner">
          <div className="lab-nav-cluster">
            <button className="lab-back" onClick={onExit} aria-label="بازگشت به فهرست ماموریت‌ها" title="بازگشت به فهرست ماموریت‌ها">
              <ArrowRight size={18} />
            </button>
            <div className="lab-title-group">
              <div className="lab-breadcrumbs">
                <span className="lab-badge-order">ماموریت {fa(mission.order)} از {fa(missions.length)}</span>
                <span className="lab-badge-sep">•</span>
                <span className="lab-badge-lesson">{mission.relatedLesson}</span>
              </div>
              <h1 className="lab-mission-heading">{mission.title}</h1>
            </div>
          </div>

          <div className="lab-topbar-steps" aria-hidden="true">
            {mission.objectives.map((o, idx) => {
              const met = metIds.includes(o.id);
              return (
                <div key={o.id} className={`lab-step-node ${met ? "is-met" : ""}`} title={o.label}>
                  <span className="lsn-dot">{met ? <Check size={11} strokeWidth={3} /> : fa(idx + 1)}</span>
                  <span className="lsn-label">هدف {fa(idx + 1)}</span>
                </div>
              );
            })}
          </div>

          <div className="lab-obj-capsule" aria-live="polite" aria-label={`${fa(metIds.length)} از ${fa(mission.objectives.length)} هدف تکمیل شده`}>
            <div className="loc-donut" style={{ "--p": `${objPct}%` } as React.CSSProperties}>
              <span className="loc-donut-core">
                {objPct === 100 ? (
                  <Check size={13} strokeWidth={3} className="loc-donut-check" />
                ) : (
                  <b>{fa(metIds.length)}</b>
                )}
              </span>
            </div>
            <div className="loc-details">
              <div className="loc-label">
                <span>اهداف ماموریت</span>
                <b className="loc-fraction">{fa(metIds.length)}/{fa(mission.objectives.length)}</b>
              </div>
              <div className="loc-bar">
                <span style={{ width: `${objPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="lab-topbar-progress-line" aria-hidden="true">
          <div className="ltp-fill" style={{ width: `${objPct}%` }} />
        </div>
      </header>

      {setupError && (
        <div className="lab-inline-error" role="alert">
          <AlertTriangle size={16} />
          <span>محیط اولیه بارگذاری نشد ({setupError}). می‌توانید ادامه دهید یا محیط را بازنشانی کنید.</span>
        </div>
      )}

      {/* تب‌های موبایل */}
      <div className="lab-tabs" role="tablist" aria-label="نمای ماموریت">
        <button role="tab" aria-selected={mobileTab === "brief"} className={mobileTab === "brief" ? "on" : ""} onClick={() => setMobileTab("brief")}>
          <Target size={14} /> ماموریت
        </button>
        <button role="tab" aria-selected={mobileTab === "terminal"} className={mobileTab === "terminal" ? "on" : ""} onClick={() => setMobileTab("terminal")}>
          <Terminal size={14} /> ترمینال
        </button>
      </div>

      <main className={`mission-layout tab-${mobileTab}`}>
        {/* ستون بریف و اهداف */}
        <aside className="mission-side">
          <section className="brief-card">
            <div className="brief-role"><UserRound size={14} /> نقش شما: <b>{mission.role}</b></div>
            {mission.brief.map((b, i) => (
              <p key={i}><Inline text={b} /></p>
            ))}
          </section>

          <section className="obj-card">
            <div className="obj-head">
              <h4><Target size={15} /> اهداف ماموریت</h4>
              <span className="obj-pct">{fa(objPct)}٪</span>
            </div>
            <div className="obj-bar"><span style={{ width: `${objPct}%` }} /></div>
            <ul>
              {mission.objectives.map((o, i) => {
                const met = metIds.includes(o.id);
                return (
                  <li key={o.id} className={`${met ? "met" : ""} ${justDone.includes(o.id) ? "flash" : ""}`}>
                    <span className="obj-mark">
                      {met ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
                    </span>
                    <span className="obj-text"><small>{fa(i + 1)}</small>{o.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="hint-card">
            {hintsShown < mission.hints.length ? (
              <button className="hint-btn" onClick={() => setHintsShown((n) => n + 1)}>
                <Lightbulb size={15} />
                {hintsShown === 0 ? "راهنمایی می‌خواهم" : `راهنمای بعدی (${fa(hintsShown)}/${fa(mission.hints.length)})`}
              </button>
            ) : (
              <p className="hint-done">همه راهنماها نمایش داده شد.</p>
            )}
            <AnimatePresence initial={false}>
              {mission.hints.slice(0, hintsShown).map((h, i) => (
                <motion.p
                  key={i}
                  className="hint-line"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                >
                  <span>{fa(i + 1)}</span> {h}
                </motion.p>
              ))}
            </AnimatePresence>
          </section>

          <button className="reset-env" onClick={reset}>
            <RotateCcw size={14} /> بازنشانی محیط
          </button>
        </aside>

        {/* فضای کار: ترمینال */}
        <section className="workspace">
          <div className="term-wrap">
            <div className="term-chrome" dir="ltr">
              <div className="term-controls" aria-hidden="true">
                <span className="term-dot dot-close" />
                <span className="term-dot dot-minimize" />
                <span className="term-dot dot-expand" />
              </div>
              <div className="term-titlebar-badge">
                <Terminal size={11} className="term-titlebar-icon" aria-hidden="true" />
                <span className="term-titlebar-text">bash — mission-{mission.order}</span>
              </div>
              <div className="term-actions">
                <span className={`term-live-indicator${running ? " is-busy" : ""}`}>
                  <span className="tli-pulse" />
                  <span className="tli-label">{running ? "running" : "live"}</span>
                </span>
                <button
                  type="button"
                  className={`term-copy-btn${copiedCmd === -1 ? " is-copied" : ""}`}
                  onClick={() => {
                    navigator.clipboard?.writeText(state.history.join("\n")).catch(() => {});
                    setCopiedCmd(-1);
                    setTimeout(() => setCopiedCmd((c) => (c === -1 ? null : c)), 1400);
                  }}
                  title="Copy command history"
                  aria-label="Copy command history"
                >
                  {copiedCmd === -1 ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCmd === -1 ? "Copied" : "Copy All"}</span>
                </button>
              </div>
            </div>
            <div className="term-screen" ref={scrollRef} onClick={() => inputRef.current?.focus()}>
              {blocks.length === 0 && (
                <div className="term-empty">
                  <span className="term-empty-line">Terminal screen cleared.</span>
                  <span className="term-empty-hint">Type <b>help</b> for command list, or pick a quick command below.</span>
                </div>
              )}
              {blocks.map((b) => (
                <div key={b.id} className={`term-block${b.toast ? " toast" : ""}`}>
                  {b.input !== undefined && (
                    <div className="term-echo">
                      <TermPrompt host="docker-lab" />
                      <span className="term-echo-cmd">{b.input}</span>
                      <button
                        type="button"
                        className={`term-row-copy${copiedCmd === b.id ? " is-done" : ""}`}
                        onClick={(e) => { e.stopPropagation(); copyCmd(b.id, b.input!); }}
                        aria-label="Copy command"
                        title="Copy command"
                      >
                        {copiedCmd === b.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                  {b.lines.map((l, i) => (
                    <div key={i} className={`term-line${l.tone ? ` t-${l.tone}` : ""}`}>{l.text || "\u00a0"}</div>
                  ))}
                </div>
              ))}
              <div className={`term-input-row${running ? " is-busy" : ""}${focused ? " is-focused" : ""}`}>
                <TermPrompt host="docker-lab" />
                <div className="term-input-wrap">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={PLACEHOLDERS[phIdx]}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoFocus
                    disabled={running}
                    aria-label="Terminal input"
                  />
                  {focused && !input && !running && <span className="term-block-cursor" aria-hidden="true" />}
                </div>
                {running && (
                  <span className="term-run-tag" aria-hidden="true">
                    <span className="term-spinner" />
                    <span>executing…</span>
                  </span>
                )}
              </div>
            </div>
            {/* خط وضعیت — مثل tmux: شمارنده‌های زنده محیط + میانبرها */}
            <div className="term-statusline" aria-label="Live environment status">
              <div className="tsl-counts" dir="ltr">
                <span className="tsl-item"><i className="tsl-dot run" /><b key={`c-${runningCount}`}>{runningCount}</b> running</span>
                {exitedCount > 0 && <span className="tsl-item"><i className="tsl-dot stop" /><b key={`e-${exitedCount}`}>{exitedCount}</b> stopped</span>}
                <span className="tsl-item"><i className="tsl-dot img" /><b key={`i-${state.images.length}`}>{state.images.length}</b> images</span>
                <span className="tsl-item"><i className="tsl-dot vol" /><b key={`v-${state.volumes.length}`}>{state.volumes.length}</b> volumes</span>
                <span className="tsl-item"><i className="tsl-dot net" /><b key={`n-${customNets}`}>{customNets}</b> networks</span>
              </div>
              <div className="tsl-keys" dir="ltr">
                <span><kbd>↑↓</kbd> history</span>
                <span><kbd>tab</kbd> complete</span>
                <span><kbd>ctrl</kbd>+<kbd>l</kbd> clear</span>
              </div>
            </div>
            <div className="term-foot">
              <div className="term-quick" aria-label="Quick commands">
                {["docker ps -a", "docker images", "docker volume ls", "docker network ls", "help"].map((q) => (
                  <button key={q} type="button" onClick={() => insert(q)} dir="ltr">{q}</button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {finished && (
          <motion.div
            className="mission-done"
            role="status"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <div className="mission-done-icon"><PartyPopper size={24} /></div>
            <div className="mission-done-text">
              <b>ماموریت کامل شد!</b>
              <p>{mission.success}</p>
            </div>
            <div className="mission-done-actions">
              <button className="md-ghost" onClick={onExit}>فهرست ماموریت‌ها</button>
              {missions.some((m) => m.order === mission.order + 1) ? (
                <button className="md-next" onClick={onNext}>ماموریت بعدی <ChevronLeft size={16} /></button>
              ) : (
                <button className="md-next" onClick={onExit}>پایان آزمایشگاه <Trophy size={16} /></button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
