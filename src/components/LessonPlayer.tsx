import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowDownUp, BookText, Bug, ChevronDown, Compass, Flag, FileCode2, FlaskConical, Globe2, Layers,
  PartyPopper, Puzzle, RotateCcw, Sparkles, Stethoscope, Telescope, TerminalSquare, X, CheckCircle2,
  GraduationCap, Bookmark, Lock,
} from "lucide-react";
import { allLessons, course } from "../data/course";
import type { Lesson, Module, Step } from "../data/course";
import {
  CheckBlock, CodeBlock, ReadBlock, TermBlock, TryBlock, WorldBlock,
  CompareBlock, DiagramBlock, RecapBlock, FillBlock, OrderBlock, DiagnoseBlock,
  SpotBlock, PredictBlock,
} from "./StepBlocks";

const fa = (n: number) => n.toLocaleString("fa-IR");

/* ── متادیتای هر نوع گام برای نوار فهرست ── */
const STEP_META: Record<Step["kind"], { label: string; icon: typeof BookText }> = {
  read: { label: "مفهوم", icon: BookText },
  compare: { label: "مقایسه", icon: Layers },
  diagram: { label: "نمودار", icon: Layers },
  world: { label: "دنیای واقعی", icon: Globe2 },
  code: { label: "کد", icon: FileCode2 },
  term: { label: "ترمینال", icon: TerminalSquare },
  check: { label: "آزمون", icon: Sparkles },
  fill: { label: "تکمیل دستور", icon: Puzzle },
  order: { label: "ترتیب‌چینی", icon: ArrowDownUp },
  diagnose: { label: "عیب‌یابی", icon: Stethoscope },
  spot: { label: "پیدا کردن خطا", icon: Bug },
  predict: { label: "پیش‌بینی", icon: Telescope },
  try: { label: "تمرین", icon: TerminalSquare },
};

/* گام‌هایی که برای عبور باید حل شوند */
const INTERACTIVE_KINDS = new Set(["check", "fill", "order", "diagnose", "spot", "predict", "try"]);
const QUIZ_KINDS = ["check", "fill", "order", "diagnose", "spot", "predict"];

/* ── مراحل چهارگانه درس: آموزش ← آزمون ← تمرین ← جمع‌بندی ── */
type Stage = "learn" | "quiz" | "practice" | "summary";
const STAGE_ORDER: Stage[] = ["learn", "quiz", "practice", "summary"];
const STAGE_META: Record<Stage, { label: string; icon: typeof BookText }> = {
  learn: { label: "آموزش مفهوم", icon: BookText },
  quiz: { label: "آزمون تعاملی", icon: Sparkles },
  practice: { label: "تمرین عملی", icon: TerminalSquare },
  summary: { label: "جمع‌بندی", icon: Bookmark },
};

const stageOfKind = (kind: Step["kind"]): Stage =>
  kind === "try" ? "practice" : QUIZ_KINDS.includes(kind) ? "quiz" : "learn";

function Confetti({ color }: { color: string }) {
  const reduceMotion = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        left: (i * 33) % 100,
        delay: ((i * 11) % 10) / 12,
        duration: 1.9 + ((i * 7) % 10) / 8,
        rotate: (i * 47) % 360,
        color: [color, "#fbbf24", "#fa5238", "#10b981", "#7c3aed", "#06b6d4"][i % 6],
        size: 8 + ((i * 13) % 6),
      })),
    [color]
  );
  if (reduceMotion) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size * 0.5,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ── جداکننده بصری بین مراحل درس ── */
function StageDivider({ stage, color }: { stage: Stage; color: string }) {
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  const caption =
    stage === "quiz"
      ? "ابتدا درک مفهومی خود را محک بزنید"
      : stage === "practice"
      ? "حالا آموخته‌ها را با دست خودتان بنویسید"
      : "";
  return (
    <motion.div
      className={`stage-divider stage-${stage}`}
      style={{ "--sc": color } as React.CSSProperties}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="stage-divider-line" aria-hidden="true" />
      <span className="stage-divider-chip">
        <Icon size={15} />
        <b>{meta.label}</b>
        {caption && <em>{caption}</em>}
      </span>
      <span className="stage-divider-line" aria-hidden="true" />
    </motion.div>
  );
}

export function LessonPlayer({
  lessonId,
  onExit,
  onComplete,
  onNext,
}: {
  lessonId: string;
  onExit: () => void;
  onComplete: (id: string) => void;
  onNext: (id: string | null) => void;
}) {
  const { lesson, module } = useMemo(() => {
    const mod = course.find((m) => m.lessons.some((l) => l.id === lessonId)) as Module;
    return { module: mod, lesson: mod.lessons.find((l) => l.id === lessonId) as Lesson };
  }, [lessonId]);

  const [visible, setVisible] = useState(1);
  const [solved, setSolved] = useState<boolean[]>(() => lesson.steps.map(() => false));
  const [finished, setFinished] = useState(false);
  const [activeReadingStep, setActiveReadingStep] = useState(0);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const total = lesson.steps.length;

  useEffect(() => {
    setVisible(1);
    setSolved(lesson.steps.map(() => false));
    setFinished(false);
    setActiveReadingStep(0);
    setShowMobileTimeline(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessonId, lesson.steps]);

  useEffect(() => {
    if (visible > 1) {
      const t = setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 130);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      return () => clearTimeout(t);
    }
  }, [finished]);
  /* رصد موقعیت اسکرول (Scroll Spy) برای هایلایت خودکار گام در حال مطالعه */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const triggerPoint = scrollY + 220;

      if (summaryRef.current) {
        const summaryTop = summaryRef.current.getBoundingClientRect().top + scrollY;
        if (triggerPoint >= summaryTop - 40) {
          setActiveReadingStep(total);
          return;
        }
      }

      const stepElements = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
      let currentIdx = 0;
      for (let i = 0; i < stepElements.length; i++) {
        const el = stepElements[i];
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= triggerPoint) {
          currentIdx = i;
        } else {
          break;
        }
      }
      setActiveReadingStep(currentIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visible, finished, total]);

  const currentIndex = visible - 1;
  const current = lesson.steps[currentIndex];
  const interactive = current && INTERACTIVE_KINDS.has(current.kind);
  const gateOpen = !interactive || solved[currentIndex];

  /* مرحله فعلی و وضعیت هر مرحله برای نوار راهنما */
  const currentStage: Stage = finished ? "summary" : stageOfKind(current?.kind ?? "read");
  const currentStageIdx = STAGE_ORDER.indexOf(currentStage);
  const nextStep = lesson.steps[visible];

  const advance = () => {
    if (visible < total) setVisible((v) => v + 1);
    else {
      setFinished(true);
      onComplete(lesson.id);
    }
  };

  /* میانبرهای کیبورد: Enter = گام بعد، Esc = خروج */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "Escape") onExit();
      if ((e.key === "Enter" || e.key === "ArrowDown") && gateOpen && !finished) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const markSolved = (index: number) => setSolved((s) => s.map((v, i) => (i === index ? true : v)));

  /* اتصال درس به ماموریت عملی متناظر در آزمایشگاه */
  const labHint = useMemo(() => {
    const map: Record<string, string> = {
      l2: "اولین سرویس زنده",
      l5: "نجات داده‌ها",
      l6: "دو سرویس که همدیگر را پیدا نمی‌کنند",
      l8b: "کانتینری که بالا نمی‌آید",
      l11: "سرویس ضد-سقوط",
    };
    return map[lesson.id] ?? null;
  }, [lesson.id]);

  const flatIndex = allLessons.findIndex((e) => e.lesson.id === lesson.id);
  const nextLesson = allLessons[flatIndex + 1]?.lesson ?? null;
  const lessonNo = flatIndex + 1;

  const restartLesson = () => {
    setVisible(1);
    setSolved(lesson.steps.map(() => false));
    setFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpTo = (index: number) => {
    if (index >= visible && !finished) {
      if (gateOpen && index === visible) {
        setVisible(index + 1);
      } else {
        return;
      }
    }
    const el = document.querySelector(`[data-step="${index}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setShowMobileTimeline(false);
  };

  const jumpToRecap = () => {
    summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setShowMobileTimeline(false);
  };
  /* متن دکمه پیشروی بر اساس مرحله بعدی */
  const continueLabel = () => {
    if (visible >= total) return { text: "ثبت درس و مشاهده جمع‌بندی", icon: <Bookmark size={18} /> };
    const ns = stageOfKind(nextStep.kind);
    if (ns === "quiz") return { text: "رفتن به آزمون کوتاه", icon: <Sparkles size={18} /> };
    if (ns === "practice") return { text: "شروع تمرین عملی", icon: <TerminalSquare size={18} /> };
    return { text: "گام بعدی", icon: <ChevronDown size={19} className="bounce-icon" /> };
  };
  const cta = continueLabel();

  return (
    <div className="player">
      <header className="player-bar">
        <button className="exit-btn" onClick={onExit} aria-label="بازگشت به نقشه دوره">
          <X size={19} />
        </button>
        <div className="player-title">
          <small style={{ color: module.color }}>
            {module.label} · {module.en}
          </small>
          <strong>
            درس {fa(lessonNo)}: {lesson.title}
          </strong>
        </div>
        <div className="player-meta">
          <div className="player-meta-top">
            <span className="step-counter" dir="rtl">
              گام {fa(Math.min(visible, total))} از {fa(total)}
            </span>
            <span className="kbd-chip" dir="ltr">Enter ⇢ بعدی</span>
            <button className="restart-btn" onClick={restartLesson} title="شروع مجدد این درس">
              <RotateCcw size={13} />
            </button>
          </div>
          <div className="player-progress" aria-hidden="true">
            {lesson.steps.map((_, i) => (
              <motion.span
                key={i}
                className={i < visible ? (i === currentIndex && !finished ? "seg now" : "seg done") : "seg"}
                style={i < visible ? { background: module.color } : undefined}
                layout
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* نوار مراحل چهارگانه درس */}
      <div className="stage-bar" style={{ "--sc": module.color } as React.CSSProperties}>
        <ol className="stage-track">
          {STAGE_ORDER.map((stage, i) => {
            const meta = STAGE_META[stage];
            const Icon = meta.icon;
            const state = i < currentStageIdx ? "done" : i === currentStageIdx ? "current" : "pending";
            return (
              <li key={stage} className={`stage-node ${state}`}>
                <span className="stage-node-dot">
                  {state === "done" ? <CheckCircle2 size={15} /> : state === "pending" ? <Lock size={12} /> : <Icon size={15} />}
                </span>
                <span className="stage-node-label">{meta.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="player-layout">
        {/* فهرست گام‌های درس */}
        <aside className="outline-rail" aria-label="فهرست گام‌های درس">
          <div className="outline-title">
            <span>ساختار درس</span>
            <span className="outline-counter">{fa(Math.min(activeReadingStep + 1, total))}/{fa(total)}</span>
          </div>
          <ol>
            {lesson.steps.map((step, i) => {
              const meta = STEP_META[step.kind];
              const Icon = meta.icon;
              const isDone = finished || i < visible - 1;
              const isReading = activeReadingStep === i && !finished;
              const isTarget = i === currentIndex && !finished;
              const isLocked = i >= visible && !finished;

              return (
                <li key={i}>
                  <button
                    className={`outline-item ${isDone ? "done" : ""} ${isReading ? "reading" : ""} ${isTarget ? "current" : ""} ${isLocked ? "pending" : ""} ${step.kind === "try" ? "is-try" : ""} ${step.kind === "check" ? "is-check" : ""}`}
                    onClick={() => jumpTo(i)}
                    disabled={isLocked}
                    title={`${meta.label}${isDone ? " (تکمیل شده)" : isReading ? " (در حال مطالعه)" : ""}`}
                  >
                    <span className="outline-icon">
                      {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                    </span>
                    <span className="outline-label">{meta.label}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <button
                className={`outline-item recap ${finished ? "done" : activeReadingStep >= total ? "reading" : "pending"}`}
                disabled={!finished}
                onClick={jumpToRecap}
                title="جمع‌بندی درس"
              >
                <span className="outline-icon">{finished ? <CheckCircle2 size={14} /> : <Lock size={12} />}</span>
                <span className="outline-label">جمع‌بندی</span>
              </button>
            </li>
          </ol>
        </aside>

        <main className="player-body">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lesson-intro"
            style={{ "--mc": module.color } as React.CSSProperties}
          >
            <div className="goal-chip">
              <Flag size={17} style={{ color: module.color }} />
              <div>
                <b>دست‌آورد نهایی این درس</b>
                <span>{lesson.goal}</span>
              </div>
            </div>
            <div className="why-chip">
              <Compass size={17} />
              <div>
                <b>اهمیت در پروژه‌های واقعی</b>
                <span>{lesson.why}</span>
              </div>
            </div>
          </motion.div>

          {lesson.steps.slice(0, visible).map((step, i) => {
            const stage = stageOfKind(step.kind);
            const prevStage = i > 0 ? stageOfKind(lesson.steps[i - 1].kind) : null;
            const showDivider = prevStage !== null && stage !== prevStage && stage !== "learn";
            return (
              <div key={i} data-step={i} className="step-anchor">
                {showDivider && <StageDivider stage={stage} color={module.color} />}
                {(() => {
                  switch (step.kind) {
                    case "read":
                      return <ReadBlock step={step} />;
                    case "compare":
                      return <CompareBlock step={step} />;
                    case "diagram":
                      return <DiagramBlock step={step} />;
                    case "world":
                      return <WorldBlock step={step} />;
                    case "code":
                      return <CodeBlock step={step} />;
                    case "term":
                      return <TermBlock step={step} />;
                    case "check":
                      return <CheckBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                    case "fill":
                      return <FillBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                    case "order":
                      return <OrderBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                    case "diagnose":
                      return <DiagnoseBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                    case "spot":
                      return <SpotBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                    case "predict":
                      return <PredictBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                    case "try":
                      return <TryBlock step={step} solved={solved[i]} onSolve={() => markSolved(i)} />;
                  }
                })()}
              </div>
            );
          })}

          {/* راهنمای قفل: تا حل نکردن آزمون/تمرین اجازه عبور نیست */}
          {!finished && !gateOpen && (
            <motion.p
              className="gate-note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Lock size={14} />
              {current?.kind === "try"
                ? "برای دیدن جمع‌بندی درس، ابتدا این تمرین را با موفقیت کامل کنید."
                : "برای رفتن به گام بعد، ابتدا این چالش را حل کنید."}
            </motion.p>
          )}

          {!finished && gateOpen && (
            <motion.div
              key={`continue-wrap-${visible}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="continue-wrapper"
            >
              <button className="continue-btn" style={{ background: module.color }} onClick={advance}>
                {cta.text} {cta.icon}
              </button>
            </motion.div>
          )}

          {/* ── مرحله چهارم: جمع‌بندی (فقط پس از تکمیل تمرین) ── */}
          <AnimatePresence>
            {finished && (
              <motion.section
                ref={summaryRef}
                className="summary-stage"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                aria-label="جمع‌بندی درس"
              >
                <StageDivider stage="summary" color={module.color} />

                <RecapBlock lessonId={lesson.id} />

                <motion.div
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reduceMotion ? 0 : 0.15, type: "spring", stiffness: 220, damping: 22 }}
                  className="finish-card"
                >
                  <Confetti color={module.color} />
                  <div className="finish-medal" style={{ background: module.color }}>
                    <PartyPopper size={32} />
                  </div>
                  <h3>درس «{lesson.title}» با موفقیت کامل شد!</h3>
                  <p>
                    {nextLesson
                      ? `آماده ورود به درس بعدی هستید؟ ${fa(allLessons.length - lessonNo)} درس دیگر تا تسلط کامل مانده است.`
                      : "🎉 تبریک! شما تمام درس‌های دوره جامع بندر داکر را با موفقیت گذراندید."}
                  </p>
                  {labHint && (
                    <div className="lab-nudge">
                      <FlaskConical size={16} />
                      <span>
                        این مفهوم یک ماموریت عملی در <b>آزمایشگاه داکر</b> دارد: «{labHint}» — بهترین زمان برای تثبیتش همین حالاست.
                      </span>
                    </div>
                  )}
                  <div className="finish-actions">
                    <button className="btn-ghost" onClick={onExit}>
                      نقشه دوره
                    </button>
                    {nextLesson ? (
                      <button className="btn-next" style={{ background: module.color }} onClick={() => onNext(nextLesson.id)}>
                        درس بعدی: {nextLesson.title} <ArrowLeft size={17} />
                      </button>
                    ) : (
                      <button className="btn-next" style={{ background: module.color }} onClick={onExit}>
                        مشاهده نقشه دوره <GraduationCap size={17} />
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>

          <div ref={endRef} style={{ height: 1, scrollMarginTop: 90 }} />
        </main>
      </div>
      {/* دکمه شناور موبایل برای ساختار درس */}
      <div className="mobile-timeline-bar">
        <button
          type="button"
          className="btn-mobile-timeline"
          onClick={() => setShowMobileTimeline(true)}
          aria-label="مشاهده ساختار درس"
        >
          <Layers size={15} />
          <span>ساختار درس</span>
          <bdi>{fa(Math.min(activeReadingStep + 1, total))}/{fa(total)}</bdi>
        </button>
      </div>

      {/* دراور ساختار درس در موبایل */}
      <AnimatePresence>
        {showMobileTimeline && (
          <div
            className="mobile-timeline-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowMobileTimeline(false);
            }}
          >
            <motion.div
              className="mobile-timeline-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mts-head">
                <div className="mts-title">
                  <Layers size={16} />
                  <strong>ساختار درس</strong>
                  <span>{fa(Math.min(activeReadingStep + 1, total))} از {fa(total)}</span>
                </div>
                <button type="button" className="mts-close" onClick={() => setShowMobileTimeline(false)} aria-label="بستن">
                  <X size={17} />
                </button>
              </div>

              <div className="mts-body">
                <ol className="mts-list">
                  {lesson.steps.map((step, i) => {
                    const meta = STEP_META[step.kind];
                    const Icon = meta.icon;
                    const isDone = finished || i < visible - 1;
                    const isReading = activeReadingStep === i && !finished;
                    const isLocked = i >= visible && !finished;

                    return (
                      <li key={i}>
                        <button
                          className={`mts-item ${isDone ? "done" : ""} ${isReading ? "reading" : ""} ${isLocked ? "pending" : ""}`}
                          onClick={() => jumpTo(i)}
                          disabled={isLocked}
                        >
                          <span className="mts-icon">
                            {isDone ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                          </span>
                          <span className="mts-label">{meta.label}</span>
                          {isReading && <span className="mts-active-badge">در حال مطالعه</span>}
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      className={`mts-item recap ${finished ? "done" : activeReadingStep >= total ? "reading" : "pending"}`}
                      disabled={!finished}
                      onClick={jumpToRecap}
                    >
                      <span className="mts-icon">{finished ? <CheckCircle2 size={15} /> : <Lock size={13} />}</span>
                      <span className="mts-label">جمع‌بندی</span>
                    </button>
                  </li>
                </ol>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
