import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check, CheckCircle2, Code2, Copy, Globe2, Lightbulb, Play, RefreshCw,
  Sparkles, TerminalSquare, X, ArrowLeft, ArrowDownUp, Layers, ShieldCheck,
  CheckSquare2, Bookmark, CornerDownLeft, Puzzle, RotateCcw, Stethoscope,
  AlertTriangle, Bug, Telescope,
} from "lucide-react";
import type { Step } from "../data/course";
import { recaps } from "../data/reference";

const toFa = (n: number) => n.toLocaleString("fa-IR");

/* ── متن با کد درون‌خطی و تأکید ── */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} dir="ltr" className="inline-code">
              {part.slice(1, -1)}
            </code>
          );
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const rise = {
  initial: { opacity: 0, y: 22, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const },
};

/* ── هایلایت سبک برای کد ── */
const DF_KEYWORDS = /^(FROM|RUN|CMD|COPY|ADD|WORKDIR|USER|EXPOSE|ENV|ARG|ENTRYPOINT|LABEL|VOLUME|HEALTHCHECK|ONBUILD|SHELL|STOPSIGNAL)\b/;
const BASH_FLAGS = /(^|\s)(-{1,2}[a-zA-Z][a-zA-Z0-9_-]*)/g;

function highlightLine(line: string, lang: "dockerfile" | "yaml" | "text" | "bash") {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#")) return <span className="tok-comment">{line}</span>;

  if (lang === "dockerfile") {
    const m = trimmed.match(DF_KEYWORDS);
    if (m) {
      const indent = line.slice(0, line.length - trimmed.length);
      const rest = trimmed.slice(m[0].length);
      const hashIdx = rest.indexOf("#");
      const asMatch = rest.match(/\bAS\s+(\S+)/);
      return (
        <>
          {indent}
          <span className="tok-key">{m[0]}</span>
          {hashIdx >= 0 ? (
            <>
              <span>{rest.slice(0, hashIdx)}</span>
              <span className="tok-comment">{rest.slice(hashIdx)}</span>
            </>
          ) : asMatch ? (
            <>
              <span>{rest.slice(0, asMatch.index)}</span>
              <span className="tok-key">AS</span>
              <span className="tok-str"> {asMatch[1]}</span>
              <span>{rest.slice((asMatch.index ?? 0) + asMatch[0].length)}</span>
            </>
          ) : (
            <span>{rest}</span>
          )}
        </>
      );
    }
  }

  if (lang === "yaml") {
    const km = line.match(/^(\s*(?:- )?)([\w.-]+)(:)(.*)$/);
    if (km) {
      const [, indent, key, colon, rest] = km;
      const hashIdx = rest.indexOf("#");
      return (
        <>
          {indent}
          <span className="tok-key">{key}</span>
          <span className="tok-dim">{colon}</span>
          {hashIdx >= 0 ? (
            <>
              <span className="tok-str">{rest.slice(0, hashIdx)}</span>
              <span className="tok-comment">{rest.slice(hashIdx)}</span>
            </>
          ) : (
            <span className="tok-str">{rest}</span>
          )}
        </>
      );
    }
    const hashIdx = line.indexOf("#");
    if (hashIdx >= 0)
      return (
        <>
          <span className="tok-str">{line.slice(0, hashIdx)}</span>
          <span className="tok-comment">{line.slice(hashIdx)}</span>
        </>
      );
    return <span className="tok-str">{line}</span>;
  }

  if (lang === "bash") {
    const hashIdx = line.indexOf("#");
    const codePart = hashIdx >= 0 ? line.slice(0, hashIdx) : line;
    const commentPart = hashIdx >= 0 ? line.slice(hashIdx) : null;
    return (
      <>
        <span dangerouslySetInnerHTML={{ __html: codePart.replace(BASH_FLAGS, '$1<span class="tok-key">$2</span>') }} />
        {commentPart && <span className="tok-comment">{commentPart}</span>}
      </>
    );
  }

  const hashIdx = line.indexOf("#");
  if (hashIdx >= 0)
    return (
      <>
        <span>{line.slice(0, hashIdx)}</span>
        <span className="tok-comment">{line.slice(hashIdx)}</span>
      </>
    );
  return <span>{line}</span>;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`copy-btn${done ? " is-done" : ""}`}
      aria-label={done ? "کپی شد" : label ?? "کپی کد"}
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {label && <span>{done ? "کپی شد" : label}</span>}
    </button>
  );
}

/* ── رنگ‌آمیزی دستورهای Docker CLI برای مرجع سریع ── */
function CommandCode({ cmd }: { cmd: string }) {
  const tokens = cmd.split(/(\s+)/);
  let dockerSeen = false;
  let subUsed = 0;
  return (
    <>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        if (tok === "docker") { dockerSeen = true; return <span key={i} className="ct-docker">{tok}</span>; }
        if (tok.startsWith("-")) return <span key={i} className="ct-flag">{tok}</span>;
        if (dockerSeen && subUsed < 2 && /^[a-z][a-z-]*$/.test(tok)) { subUsed++; return <span key={i} className="ct-sub">{tok}</span>; }
        if (/[:/@.]/.test(tok) || /^\d/.test(tok)) return <span key={i} className="ct-arg">{tok}</span>;
        return <span key={i}>{tok}</span>;
      })}
    </>
  );
}

/* ── بلوک مطالعه ── */
export function ReadBlock({ step }: { step: Extract<Step, { kind: "read" }> }) {
  return (
    <motion.article {...rise} className="step-card read-card">
      {step.title && <h3>{step.title}</h3>}
      {step.body.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      {step.tip && (
        <div className="tip-strip">
          <Lightbulb size={17} />
          <span>
            <Inline text={step.tip} />
          </span>
        </div>
      )}
    </motion.article>
  );
}

/* ── بلوک مقایسه تحلیلی ── */
export function CompareBlock({ step }: { step: Extract<Step, { kind: "compare" }> }) {
  return (
    <motion.article {...rise} className="step-card compare-card">
      <div className="quiz-tag compare-tag">
        <Layers size={14} /> مقایسه ساختاری
      </div>
      <h3>{step.title}</h3>
      {step.subtitle && <p className="compare-subtitle">{step.subtitle}</p>}
      <div className="compare-grid">
        <div className="compare-col left-col">
          <div className="compare-col-header">
            <h4>{step.left.title}</h4>
            {step.left.badge && <span className="col-badge left-badge">{step.left.badge}</span>}
          </div>
          <ul>
            {step.left.points.map((pt, i) => (
              <li key={i}>
                <span className="bullet left-bullet">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="compare-col right-col">
          <div className="compare-col-header">
            <h4>{step.right.title}</h4>
            {step.right.badge && <span className="col-badge right-badge">{step.right.badge}</span>}
          </div>
          <ul>
            {step.right.points.map((pt, i) => (
              <li key={i}>
                <CheckSquare2 size={16} className="bullet-check" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {step.conclusion && (
        <div className="compare-conclusion">
          <Sparkles size={16} />
          <span>{step.conclusion}</span>
        </div>
      )}
    </motion.article>
  );
}

/* ── بلوک دیاگرام ساختاری ── */
export function DiagramBlock({ step }: { step: Extract<Step, { kind: "diagram" }> }) {
  return (
    <motion.article {...rise} className="step-card diagram-card">
      <div className="quiz-tag diagram-tag">
        <Layers size={14} /> نمودار مفهومی
      </div>
      <h3>{step.title}</h3>
      {step.caption && <p className="diagram-caption">{step.caption}</p>}
      <div className="diagram-blocks">
        {step.blocks.map((blk, idx) => (
          <div key={blk.id} className="diagram-block-wrapper">
            <motion.div
              className="diagram-block"
              style={{ "--dc": blk.color || "#1d63ed" } as React.CSSProperties}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div className="diagram-block-tag">{blk.tag || `بخش ${idx + 1}`}</div>
              <strong className="diagram-block-label" dir="ltr">{blk.label}</strong>
              {blk.sub && <span className="diagram-block-sub">{blk.sub}</span>}
            </motion.div>
            {idx < step.blocks.length - 1 && (
              <div className="diagram-arrow" aria-hidden="true">
                <ArrowLeft size={18} />
              </div>
            )}
          </div>
        ))}
      </div>
      {step.flow && step.flow.length > 0 && (
        <div className="diagram-flow">
          {step.flow.map((item, i) => (
            <div key={i} className="diagram-flow-item">
              <span className="flow-num">{i + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </motion.article>
  );
}

/* ── بلوک دنیای واقعی و سناریو ── */
export function WorldBlock({ step }: { step: Extract<Step, { kind: "world" }> }) {
  return (
    <motion.article {...rise} className="step-card world-card">
      <div className="quiz-tag world-tag">
        <Globe2 size={15} /> در دنیای واقعی و پروداکشن
      </div>
      <h3>{step.title}</h3>
      {step.body.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      {step.scenario && (
        <div className="scenario-box">
          <div className="scenario-role">
            <ShieldCheck size={16} />
            <span>نقش سازمانی: <strong>{step.scenario.role}</strong></span>
          </div>
          <div className="scenario-content">
            <div className="scenario-row">
              <span className="scen-badge chal">چالش</span>
              <p>{step.scenario.challenge}</p>
            </div>
            <div className="scenario-row">
              <span className="scen-badge sol">راهکار داکر</span>
              <p>{step.scenario.solution}</p>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}

/* ── بلوک کد ── */
export function CodeBlock({ step }: { step: Extract<Step, { kind: "code" }> }) {
  return (
    <motion.article {...rise} className="step-card">
      {step.title && <h3>{step.title}</h3>}
      {step.body?.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      <div className="code-frame" dir="ltr">
        <div className="code-frame-bar">
          <Code2 size={14} />
          <span>{step.label}</span>
          <CopyButton text={step.code} />
        </div>
        <pre>
          {step.code.split("\n").map((line, i) => (
            <div key={i} className="code-line">
              <span className="code-num">{i + 1}</span>
              <span className="code-text">{line ? highlightLine(line, step.lang) : " "}</span>
            </div>
          ))}
        </pre>
      </div>
      {step.notes && (
        <ul className="code-notes">
          {step.notes.map((n) => (
            <li key={n.t}>
              <code dir="ltr">{n.t}</code>
              <span>{n.d}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );
}

/* ── پرامپت ترمینال (هویت مشترک) ── */
function TermPrompt({ host = "docker" }: { host?: string }) {
  return (
    <span className="term-prompt">
      <b className="tp-user">user@{host}</b>
      <i className="tp-sep">:</i>
      <i className="tp-path">~</i>
      <b className="tp-dollar">$</b>
    </span>
  );
}

/* ── بلوک ترمینال ── */
export function TermBlock({ step }: { step: Extract<Step, { kind: "term" }> }) {
  const allCmds = step.lines.filter((l) => l.cmd !== undefined).map((l) => l.cmd).join("\n");
  const [replayKey, setReplayKey] = useState(0);
  return (
    <motion.article {...rise} className="step-card">
      {step.title && <h3>{step.title}</h3>}
      {step.body?.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      <div className="term-frame" dir="ltr">
        <div className="term-frame-bar">
          <i /><i /><i />
          <span className="tf-title">user@docker: ~</span>
          <span className="tf-actions">
            <button className="copy-btn" title="Replay animation" aria-label="Replay animation" onClick={() => setReplayKey((k) => k + 1)}>
              <RotateCcw size={13} />
            </button>
            <CopyButton text={allCmds} />
          </span>
        </div>
        <motion.div
          key={replayKey}
          className="term-frame-body"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.055 } } }}
        >
          {step.lines.map((line, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.26 } } }}
              className={line.cmd !== undefined ? "term-cmd" : `term-out ${line.ok ? "ok" : ""} ${line.tone ? `t-${line.tone}` : ""}`}
            >
              {line.cmd !== undefined ? (
                <>
                  <TermPrompt /> {line.cmd}
                </>
              ) : (
                line.out || "\u00a0"
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
      {step.after?.map((p, i) => (
        <p key={i} className="term-after">
          <Inline text={p} />
        </p>
      ))}
    </motion.article>
  );
}

/* ── بلوک آزمون کوتاه ── */
export function CheckBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "check" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const pick = (i: number) => {
    if (solved) return;
    if (i === step.answer) onSolve();
    else if (!wrong.includes(i)) setWrong((w) => [...w, i]);
  };
  return (
    <motion.article {...rise} className="step-card check-card">
      <div className="quiz-tag">
        <Sparkles size={15} /> Checkpoint آزمون مفهومی
      </div>
      <h3>{step.question}</h3>
      <div className="quiz-options">
        {step.options.map((opt, i) => {
          const state = solved && i === step.answer ? "right" : wrong.includes(i) ? "wrong" : "";
          return (
            <button key={i} className={`quiz-option ${state}`} onClick={() => pick(i)} disabled={solved}>
              <span className="quiz-bullet">
                {state === "right" ? <Check size={15} /> : state === "wrong" ? <X size={15} /> : ["الف", "ب", "ج", "د"][i]}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {wrong.length > 0 && !solved && (
        <p className="quiz-nudge">هنوز پاسخ دقیق نیست — دوباره به تفاوت‌ها فکر کنید و گزینه دیگری را انتخاب کنید.</p>
      )}
      {solved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="quiz-explain">
          <CheckCircle2 size={18} />
          <span>{step.explain}</span>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── بلوک تمرین عملی با چک‌لیست زنده ── */
const normalize = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
const LEVEL_LABEL = ["مقدماتی", "متوسط", "پیشرفته"];

export function TryBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "try" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [code, setCode] = useState(step.starter);
  const [status, setStatus] = useState<"idle" | "fail">("idle");
  const [showHint, setShowHint] = useState(false);
  const [tries, setTries] = useState(0);

  /* چک‌لیست: از هر گروه، کوتاه‌ترین گزینه به‌عنوان برچسب نمایشی */
  const checklist = step.required.map((group) => group.reduce((a, b) => (a.length <= b.length ? a : b)));
  const answer = normalize(code);
  const met = checklist.map((label) => answer.includes(normalize(label)));

  const run = () => {
    const ok = step.required.every((alts) => alts.some((a) => answer.includes(normalize(a))));
    if (ok) onSolve();
    else {
      setStatus("fail");
      setTries((t) => t + 1);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const s = el.selectionStart;
      const next = code.slice(0, s) + "  " + code.slice(el.selectionEnd);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
    if (e.key === "Escape") e.currentTarget.blur();
  };

  const lineCount = Math.max(6, code.split("\n").length + 2);

  return (
    <motion.article {...rise} className="step-card try-card">
      <div className="try-head">
        <div className="quiz-tag try-tag">
          <TerminalSquare size={15} /> Hands-on چالش عملی
        </div>
        <div className="level-dots" title={`سطح: ${LEVEL_LABEL[step.level - 1]}`}>
          <span className="level-label">سطح {LEVEL_LABEL[step.level - 1]}</span>
          {[1, 2, 3].map((d) => (
            <i key={d} className={d <= step.level ? "on" : ""} />
          ))}
        </div>
      </div>
      <h3>{step.title}</h3>
      <p>{step.brief}</p>

      <div className={`editor-frame ${solved ? "editor-solved" : ""}`} dir="ltr">
        <div className="editor-frame-bar">
          <i /><i /><i />
          <span>{step.context}</span>
          <button onClick={() => { setCode(step.starter); setStatus("idle"); }} aria-label="پاک کردن و شروع دوباره">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="editor-shell">
          <div className="editor-gutter" aria-hidden="true">
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            dir="ltr"
            spellCheck={false}
            value={code}
            onChange={(e) => { setCode(e.target.value); setStatus("idle"); }}
            onKeyDown={handleKey}
            placeholder={step.placeholder}
            rows={lineCount}
            disabled={solved}
            aria-label="پاسخ تمرین"
          />
        </div>
      </div>

      {/* چک‌لیست الزامات: پس از نخستین تلاش ناموفق نمایان می‌شود */}
      {(tries >= 1 || solved) && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="req-checklist">
          <div className="req-head">
            <CheckSquare2 size={15} />
            <span>چک‌لیست الزامات این تمرین</span>
          </div>
          <ul>
            {checklist.map((label, i) => (
              <li key={i} className={met[i] ? "met" : ""}>
                <span className="req-mark">{met[i] ? <Check size={13} /> : <X size={13} />}</span>
                <code dir="ltr">{label}</code>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {!solved && (
        <div className="try-actions">
          <button className="btn-run" onClick={run}>
            <Play size={16} fill="currentColor" /> بررسی پاسخ
          </button>
          <button className="btn-ghost" onClick={() => setShowHint(!showHint)}>
            <Lightbulb size={16} /> راهنمایی
          </button>
          {tries >= 2 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="btn-ghost show-ans"
              onClick={() => { setCode(step.solution); setStatus("idle"); }}
            >
              <Code2 size={16} /> نمایش پاسخ پیشنهادی
            </motion.button>
          )}
          <span className="kbd-hint" dir="ltr">
            <CornerDownLeft size={12} /> Tab = فاصله
          </span>
        </div>
      )}
      {showHint && !solved && (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="hint-strip">
          💡 {step.hint}
        </motion.p>
      )}
      {status === "fail" && !solved && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fail-strip">
          پاسخ کامل نیست — چک‌لیست بالا را ببینید و موارد قرمز را اضافه کنید.
          {tries >= 2 && " (دکمه «نمایش پاسخ پیشنهادی» اکنون فعال شد!)"}
        </motion.p>
      )}
      {solved && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="success-strip">
          <CheckCircle2 size={19} />
          <span>{step.success}</span>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── بلوک تکمیل دستور (Fill in the blank — تکنیک Faded Examples) ── */
export function FillBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "fill" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [picks, setPicks] = useState<number[]>(() => step.blanks.map(() => -1));
  const [triedWrong, setTriedWrong] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);

  const pick = (blankIdx: number, optIdx: number) => {
    if (solved || picks[blankIdx] === step.blanks[blankIdx].answer) return;
    const key = `${blankIdx}:${optIdx}`;
    if (triedWrong.includes(key)) return;
    if (optIdx === step.blanks[blankIdx].answer) {
      const next = picks.map((p, i) => (i === blankIdx ? optIdx : p));
      setPicks(next);
      if (next.every((p, i) => p === step.blanks[i].answer)) onSolve();
    } else {
      setTriedWrong((t) => [...t, key]);
      setFlash(true);
      setTimeout(() => setFlash(false), 550);
    }
  };

  return (
    <motion.article {...rise} className="step-card fill-card">
      <div className="quiz-tag fill-tag">
        <Puzzle size={15} /> تکمیل دستور
      </div>
      {step.title && <h3>{step.title}</h3>}
      {step.body?.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      <div className={`fill-preview ${flash ? "flash" : ""}`} dir="ltr">
        {step.before}
        {step.blanks.map((blank, bi) => (
          <span key={bi} className={`fill-slot ${picks[bi] === blank.answer ? "filled" : ""}`}>
            {picks[bi] >= 0 ? blank.options[picks[bi]] : "؟؟؟"}
          </span>
        ))}
        {step.after}
      </div>
      {!solved && (
        <>
          {step.blanks.map((blank, bi) => (
            <div key={bi} className="fill-options" dir="ltr">
              {step.blanks.length > 1 && <span className="fill-blank-label">جای خالی {bi + 1}:</span>}
              {blank.options.map((opt, oi) => {
                const isPicked = picks[bi] === oi;
                const isWrongTried = triedWrong.includes(`${bi}:${oi}`);
                return (
                  <button
                    key={oi}
                    className={`fill-opt ${isPicked && !isWrongTried ? "correct" : ""} ${isWrongTried ? "used" : ""}`}
                    onClick={() => pick(bi, oi)}
                    disabled={isPicked || isWrongTried || solved || picks[bi] === blank.answer}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}
        </>
      )}
      {solved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="quiz-explain">
          <CheckCircle2 size={18} />
          <span>{step.explain}</span>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── بلوک ترتیب‌چینی (Ordering Challenge) ── */
export function OrderBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "order" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [evalSlots, setEvalSlots] = useState<boolean[] | null>(null);
  const [showHint, setShowHint] = useState(false);

  /* چیدمان اولیه به‌هم‌ریخته اما پایدار */
  const pool = useMemo(() => {
    const arr = step.items.map((_, i) => i);
    let seed = step.items.length * 7919 + step.items.join("").length;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.every((v, i) => v === step.answer[i])) [arr[0], arr[1]] = [arr[1], arr[0]];
    return arr;
  }, [step.items, step.answer]);

  const add = (itemIdx: number) => {
    if (solved || placed.includes(itemIdx) || placed.length >= step.items.length) return;
    const next = [...placed, itemIdx];
    setPlaced(next);
    if (next.length === step.items.length) {
      const res = next.map((v, pos) => v === step.answer[pos]);
      setEvalSlots(res);
      if (res.every(Boolean)) onSolve();
    } else {
      setEvalSlots(null);
    }
  };

  const remove = (pos: number) => {
    if (solved) return;
    setPlaced(placed.filter((_, i) => i !== pos));
    setEvalSlots(null);
  };

  const wrongCount = evalSlots ? evalSlots.filter(Boolean).length : 0;

  return (
    <motion.article {...rise} className="step-card order-card">
      <div className="quiz-tag order-tag">
        <ArrowDownUp size={15} /> ترتیب‌چینی
      </div>
      {step.title && <h3>{step.title}</h3>}
      {step.body?.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      <div className="order-answer">
        {placed.length === 0 && <p className="order-empty">برای چیدن ترتیب، روی خطوط پایین کلیک کنید…</p>}
        {placed.map((itemIdx, pos) => (
          <button key={`${itemIdx}-${pos}`} dir="ltr" className={`order-placed ${evalSlots ? (evalSlots[pos] ? "slot-right" : "slot-wrong") : ""}`} onClick={() => remove(pos)} disabled={solved} title={solved ? undefined : "برای حذف کلیک کنید"}>
            <span className="order-no">{pos + 1}</span>
            <span className="order-text">{step.items[itemIdx]}</span>
            {!solved && <X size={14} className="order-remove" />}
          </button>
        ))}
      </div>
      {evalSlots && !solved && (
        <p className="fail-strip">
          {wrongCount} از {step.items.length} خط در جای درست است — خطوط قرمز را با کلیک حذف کنید و دوباره بچینید.
        </p>
      )}
      {!solved && (
        <>
          <div className="order-pool" dir="ltr">
            {pool.map((itemIdx) => (
              <button key={itemIdx} className="order-chip" onClick={() => add(itemIdx)} disabled={placed.includes(itemIdx)}>
                {step.items[itemIdx]}
              </button>
            ))}
          </div>
          <div className="order-foot">
            <button className="btn-ghost" onClick={() => { setPlaced([]); setEvalSlots(null); }}>
              <RotateCcw size={15} /> پاک کردن
            </button>
            {step.hint && (
              <button className="btn-ghost" onClick={() => setShowHint(!showHint)}>
                <Lightbulb size={15} /> راهنمایی
              </button>
            )}
          </div>
          {showHint && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="hint-strip">
              💡 {step.hint}
            </motion.p>
          )}
        </>
      )}
      {solved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="quiz-explain">
          <CheckCircle2 size={18} />
          <span>{step.explain}</span>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── بلوک عیب‌یابی (Debugging Scenario) ── */
export function DiagnoseBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "diagnose" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const pick = (i: number) => {
    if (solved) return;
    if (i === step.answer) onSolve();
    else if (!wrong.includes(i)) setWrong((w) => [...w, i]);
  };
  return (
    <motion.article {...rise} className="step-card diagnose-card">
      <div className="quiz-tag diagnose-tag">
        <Stethoscope size={15} /> سناریوی عیب‌یابی
      </div>
      {step.title && <h3>{step.title}</h3>}
      <div className="term-frame" dir="ltr">
        <div className="term-frame-bar">
          <i /><i /><i />
          <TerminalSquare size={14} />
        </div>
        <div className="term-frame-body">
          {step.lines.map((line, i) => (
            <div key={i} className={line.cmd !== undefined ? "term-cmd" : "term-out"}>
              {line.cmd !== undefined ? (
                <>
                  <span>{line.prompt || "$"}</span> {line.cmd}
                </>
              ) : (
                line.out || "\u00a0"
              )}
            </div>
          ))}
        </div>
      </div>
      <h3 className="diagnose-question">{step.question}</h3>
      <div className="quiz-options">
        {step.options.map((opt, i) => {
          const state = solved && i === step.answer ? "right" : wrong.includes(i) ? "wrong" : "";
          return (
            <button key={i} className={`quiz-option ${state}`} onClick={() => pick(i)} disabled={solved}>
              <span className="quiz-bullet">
                {state === "right" ? <Check size={15} /> : state === "wrong" ? <X size={15} /> : ["الف", "ب", "ج", "د"][i]}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {wrong.length > 0 && !solved && (
        <p className="quiz-nudge">این تشخیص درست نیست — خروجی ترمینال را دقیق‌تر بخوانید.</p>
      )}
      {solved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="quiz-explain">
          <CheckCircle2 size={18} />
          <span>{step.explain}</span>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── بلوک پیدا کردن خطا (Spot the Bug) ── */
export function SpotBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "spot" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [marked, setMarked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const lines = step.code.split("\n");

  const toggle = (i: number) => {
    if (solved) return;
    if (step.faulty.includes(i)) {
      const next = marked.includes(i) ? marked.filter((m) => m !== i) : [...marked, i];
      setMarked(next);
      if (next.length === step.faulty.length && step.faulty.every((f) => next.includes(f))) onSolve();
    } else {
      setWrongFlash(i);
      setTimeout(() => setWrongFlash(null), 700);
    }
  };

  return (
    <motion.article {...rise} className="step-card spot-card">
      <div className="quiz-tag spot-tag">
        <Bug size={15} /> پیدا کردن خطا
      </div>
      {step.title && <h3>{step.title}</h3>}
      {step.body?.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      <div className="spot-frame" dir="ltr">
        <div className="spot-frame-bar">
          <Code2 size={14} />
          <span>{step.label}</span>
          <span className="spot-counter">
            {marked.length} / {step.faulty.length}
          </span>
        </div>
        <div className="spot-body">
          {lines.map((line, i) => {
            const isMarked = marked.includes(i);
            const isFaulty = revealed || solved ? step.faulty.includes(i) : null;
            return (
              <button
                key={i}
                dir="ltr"
                className={`spot-line ${isMarked ? "marked" : ""} ${isFaulty === true ? "reveal-bad" : ""} ${
                  isFaulty === false && revealed ? "reveal-ok" : ""
                } ${wrongFlash === i ? "wrong-flash" : ""}`}
                onClick={() => toggle(i)}
                disabled={solved}
              >
                <span className="spot-num">{i + 1}</span>
                <span className="spot-glyph">{isMarked ? <X size={13} /> : isFaulty === true ? <AlertTriangle size={12} /> : null}</span>
                <span className="spot-code">{line ? highlightLine(line, step.lang) : " "}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!solved && (
        <div className="order-foot">
          {step.hint && (
            <button className="btn-ghost" onClick={() => setRevealed(!revealed)}>
              <Lightbulb size={15} /> {revealed ? "پنهان کردن راهنما" : "نمایش خطوط مشکل‌دار"}
            </button>
          )}
          <span className="spot-tip">روی خطی که فکر می‌کنید مشکل دارد کلیک کنید</span>
        </div>
      )}
      {solved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="quiz-explain">
          <CheckCircle2 size={18} />
          <div>
            <span>{step.explain}</span>
            {step.why && <em className="spot-extra">{step.why}</em>}
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── بلوک پیش‌بینی خروجی (Predict — تمرین بازیابی) ── */
export function PredictBlock({
  step,
  solved,
  onSolve,
}: {
  step: Extract<Step, { kind: "predict" }>;
  solved: boolean;
  onSolve: () => void;
}) {
  const [wrong, setWrong] = useState<number[]>([]);
  const pick = (i: number) => {
    if (solved) return;
    if (i === step.answer) onSolve();
    else if (!wrong.includes(i)) setWrong((w) => [...w, i]);
  };
  return (
    <motion.article {...rise} className="step-card predict-card">
      <div className="quiz-tag predict-tag">
        <Telescope size={15} /> پیش‌بینی خروجی
      </div>
      {step.title && <h3>{step.title}</h3>}
      {step.body?.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      {step.setup && (
        <div className="predict-setup" dir="ltr">
          {step.setup.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
      <h3 className="diagnose-question">{step.prompt}</h3>
      <div className="quiz-options">
        {step.options.map((opt, i) => {
          const state = solved && i === step.answer ? "right" : wrong.includes(i) ? "wrong" : "";
          return (
            <button key={i} className={`quiz-option ${state}`} onClick={() => pick(i)} disabled={solved}>
              <span className="quiz-bullet">
                {state === "right" ? <Check size={15} /> : state === "wrong" ? <X size={15} /> : ["الف", "ب", "ج", "د"][i]}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {wrong.length > 0 && !solved && <p className="quiz-nudge">پیش‌بینی دقیق نیست — یک‌بار دیگر به مفهوم فکر کنید.</p>}
      {solved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="quiz-explain">
          <CheckCircle2 size={18} />
          <span>{step.explain}</span>
        </motion.div>
      )}
    </motion.article>
  );
}

/* ── کارت جمع‌بندی درس ── */
export function RecapBlock({ lessonId }: { lessonId: string }) {
  const recap = recaps[lessonId];
  if (!recap) return null;
  return (
    <motion.article {...rise} className="step-card recap-card">
      <div className="quiz-tag recap-tag">
        <Bookmark size={15} /> جمع‌بندی و مرور سریع
      </div>
      <h3>{recap.title}</h3>
      <span className="recap-label">آنچه در این درس آموختید</span>
      <ul className="recap-points">
        {recap.points.map((pt, i) => (
          <li key={i}>
            <Check size={16} />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
      <div className="kcr">
        <div className="kcr-head">
          <div className="kcr-head-title">
            <span className="kcr-head-icon"><TerminalSquare size={15} /></span>
            <div>
              <b>دستورهای کلیدی برای مرور</b>
              <em>{toFa(recap.commands.length)} دستور · قابل کپی</em>
            </div>
          </div>
          <CopyButton text={recap.commands.map((c) => c.cmd).join("\n")} label="کپی همه" />
        </div>
        <ul className="kcr-list">
          {recap.commands.map((c) => (
            <li key={c.cmd} className="kcr-card">
              <div className="kcr-cmd" dir="ltr">
                <span className="kcr-prompt" aria-hidden="true">$</span>
                <code><CommandCode cmd={c.cmd} /></code>
                <CopyButton text={c.cmd} />
              </div>
              <p className="kcr-desc">{c.d}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="recap-next">
        <ArrowLeft size={16} />
        <span>{recap.next}</span>
      </div>
    </motion.article>
  );
}
