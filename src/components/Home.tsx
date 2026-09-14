import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowDownUp, BookOpenCheck, Bug, CheckCircle2, Clock3, FlaskConical, Lock, Play, Puzzle,
  ExternalLink, Sparkles, Stethoscope, Target, Telescope, Terminal, TerminalSquare, Trophy, HelpCircle, Search, RotateCcw, FolderSync
} from "lucide-react";
import { allLessons, course } from "../data/course";
import { Footer } from "./Footer";
import { BackupModal } from "./BackupModal";

const fa = (n: number) => n.toLocaleString("fa-IR");

function BookmarkMarked() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      <path d="M9 7h6" />
    </svg>
  );
}

function Whale() {
  return (
    <div className="whale" aria-hidden="true">
      <div className="whale-boxes">
        <i /><i /><i /><i /><i />
      </div>
      <div className="whale-hull">
        <span className="whale-eye" />
      </div>
      <div className="whale-spout" />
      <div className="whale-sea" />
    </div>
  );
}

/* آیکون انواع تمرین برای نمایش در کارت درس‌ها */
const KIND_ICON: Record<string, { label: string; icon: typeof Play }> = {
  check: { label: "آزمون", icon: Sparkles },
  fill: { label: "تکمیل دستور", icon: Puzzle },
  order: { label: "ترتیب‌چینی", icon: ArrowDownUp },
  diagnose: { label: "عیب‌یابی", icon: Stethoscope },
  spot: { label: "پیدا کردن خطا", icon: Bug },
  predict: { label: "پیش‌بینی خروجی", icon: Telescope },
  try: { label: "تمرین عملی", icon: TerminalSquare },
};

const FAQ_ITEMS = [
  {
    q: "آیا برای گذراندن این دوره نیاز به نصب قبلی Docker دارم؟",
    a: "خیر! محیط ترمینال و داکرفایل درون مرورگر شما شبیه‌سازی و بررسی می‌شود و تمام مفاهیم را همین‌جا تست می‌کنید. البته داشتن Docker Desktop روی کامپیوترتان به تمرین‌های شخصی پس از پایان دوره کمک می‌کند.",
  },
  {
    q: "این دوره چه سرفصل‌هایی را پوشش می‌دهد؟",
    a: "از تفاوت کانتینر با ماشین مجازی شروع می‌شود و گام‌به‌گام وارد چرخه کانتینر، Dockerfile بهینه، انتشار در Registry، پایداری با Volume، شبکه اختصاصی DNS، کامپوز، پیکربندی محیطی، جریان توسعه با Watch، بیلد چندمرحله‌ای، امنیت و در پایان مهارت‌های عملیاتی (سقف منابع، مدیریت لاگ و خاموشی آرام) می‌شود.",
  },
  {
    q: "تفاوت این وب‌سایت با خواندن داکیومنت چیست؟",
    a: "داکیومنت فقط ابزارها را توصیف می‌کند؛ این پلتفرم شما را در سناریوهای واقعی مهندسی قرار می‌دهد (مثل حل مشکل باگ Healthcheck یا لایه‌بندی کش) و اجازه نمی‌دهد بدون حل چالش عملی از مبحث عبور کنید.",
  },
  {
    q: "بعد از این دوره باید سراغ چه موضوعی بروم؟",
    a: "اول یکی از پروژه‌های خودتان را با Dockerfile و compose.yaml کانتینری کنید. بعد از آن، مسیر طبیعی Kubernetes، رجیستری خصوصی و CI/CD است — وقتی Compose برایتان عادی شد، ارکستراسیون دیگر ترسناک نیست.",
  },
];

export function Home({
  completed,
  onOpen,
  onOpenCheatsheet,
  onOpenLab,
  onResetProgress,
  onRestoreProgress,
}: {
  completed: string[];
  onOpen: (id: string) => void;
  onOpenCheatsheet?: () => void;
  onOpenLab?: () => void;
  onResetProgress?: () => void;
  onRestoreProgress?: (newCompleted: string[]) => void;
}) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [showBackupModal, setShowBackupModal] = useState(false);

  const totalLessons = allLessons.length;
  const doneCount = completed.length;
  const pct = Math.round((doneCount / totalLessons) * 100);
  const nextEntry = allLessons.find((e) => !completed.includes(e.lesson.id));
  const isUnlocked = (lessonId: string) => {
    const idx = allLessons.findIndex((e) => e.lesson.id === lessonId);
    return idx === 0 || completed.includes(allLessons[idx - 1].lesson.id) || completed.includes(lessonId);
  };
  const totalMinutes = allLessons.reduce((s, e) => s + e.lesson.minutes, 0);
  const totalInteractive = allLessons.reduce(
    (s, e) =>
      s + e.lesson.steps.filter((st) => ["try", "check", "fill", "order", "diagnose"].includes(st.kind)).length,
    0
  );
  const q = searchFilter.trim().toLowerCase();
  const matchesSearch = (mod: (typeof course)[number], lesson: (typeof course)[number]["lessons"][number]) =>
    !q ||
    lesson.title.toLowerCase().includes(q) ||
    lesson.goal.toLowerCase().includes(q) ||
    mod.title.toLowerCase().includes(q) ||
    mod.en.toLowerCase().includes(q);
  const hasSearchHits = course.some((mod) => mod.lessons.some((lesson) => matchesSearch(mod, lesson)));

  return (
    <div className="home">
      <header className="topbar">
        <div className="topbar-glow" aria-hidden="true" />
        <div className="brand">
          <span className="brand-cube" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-words">
            <strong>بندرِ داکر</strong>
            <small dir="ltr">Docker Harbor</small>
          </span>
        </div>

        <nav className="topbar-nav" aria-label="ناوبری اصلی">
          <a className="nav-chip" href="#course" onClick={(e) => { e.preventDefault(); document.getElementById("course")?.scrollIntoView({ behavior: "smooth" }); }}>
            <BookOpenCheck size={14} /> <span>دوره</span>
          </a>
          {onOpenLab && (
            <button className="nav-chip nav-chip-lab" onClick={onOpenLab}>
              <FlaskConical size={14} /> <span>آزمایشگاه</span>
            </button>
          )}
          {onOpenCheatsheet && (
            <button className="nav-chip" onClick={onOpenCheatsheet}>
              <BookmarkMarked /> <span>دستورات</span>
            </button>
          )}
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className="topbar-backup-btn"
            onClick={() => setShowBackupModal(true)}
            title="پشتیبان‌گیری و بازیابی پیشرفت"
            aria-label="پشتیبان‌گیری و بازیابی پیشرفت"
          >
            <FolderSync size={13} />
            <span>پشتیبان</span>
          </button>
          {doneCount > 0 && onResetProgress && (
            <button
              className="reset-progress-btn"
              onClick={() => {
                if (window.confirm("آیا مایلید تمام سوابق پیشرفت دوره ریست شده و از درس اول شروع کنید؟")) {
                  onResetProgress();
                }
              }}
              title="شروع مجدد دوره از ابتدا"
            >
              <RotateCcw size={13} />
              <span>ریست</span>
            </button>
          )}
          <div className="topbar-progress" aria-label={`پیشرفت دوره ${fa(pct)} درصد`}>
            <div className="topbar-track">
              <motion.span initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
            </div>
            <b>٪{fa(pct)}</b>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-deco" aria-hidden="true"><i /><i /><i /></div>
        <motion.div className="hero-text" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <span className="hero-kicker">
            <Sparkles size={15} /> دوره جامع، تعاملی و پروژه-محور Docker
          </span>
          <h1>
            Docker را <mark>گام‌به‌گام</mark>
            <br />
            با دست‌های خودتان بیاموزید
          </h1>
          <p>
            نه مقالات خشک تئوری، نه داکیومنت خسته‌کننده — یک استودیوی یادگیری زنده. در هر درس ابتدا با یک مشکل واقعی روبرو می‌شوید، ساختار معماری را تحلیل می‌کنید، دمو را در ترمینال می‌بینید و تا چالش عملی را حل نکنید متوقف نخواهید شد.
          </p>
          <div className="hero-cta">
            <motion.button
              className="btn-start"
              onClick={() => nextEntry && onOpen(nextEntry.lesson.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={18} fill="currentColor" />
              {doneCount === 0 ? "شروع اولین درس" : doneCount === totalLessons ? "مرور کامل دوره" : `ادامه یادگیری: ${nextEntry?.lesson.title}`}
            </motion.button>
            <div className="hero-stats">
              <span><BookOpenCheck size={16} /> {fa(totalLessons)} درس ساختارمند</span>
              <span><TerminalSquare size={16} /> {fa(totalInteractive)} چالش و کوییز عملی</span>
              <span><Clock3 size={16} /> حدود {fa(Math.round(totalMinutes / 60))} ساعت آموزش متمرکز</span>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="hero-art"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.12 }}
        >
          <Whale />
        </motion.div>
      </section>

      <section className="journey" id="course">
        <div className="journey-head">
          <div className="journey-badge">سفر به سلامت مندس</div>
          <h2>نقشه راه تسلط بر Docker</h2>
          <p>هر مبحث به صورت منطقی بر پایه مباحث پیشین بنا شده است. درس‌ها را یکی‌یکی باز کنید و تسلط خود را محک بزنید.</p>

          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="جستجو در سرفصل‌ها (مثال: volume، compose، multi-stage)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              aria-label="جستجوی درس‌ها"
            />
          </div>
        </div>

        <div className="journey-line">
          {q && !hasSearchHits && (
            <p className="search-empty">سرفصلی با این عبارت پیدا نشد. عبارت کوتاه‌تری مثل volume یا compose را امتحان کنید.</p>
          )}
          {course.map((mod, mi) => {
            const filteredLessons = mod.lessons.filter((l) => matchesSearch(mod, l));
            if (filteredLessons.length === 0) return null;

            const modDone = mod.lessons.filter((l) => completed.includes(l.id)).length;
            const modAll = mod.lessons.length;
            return (
              <motion.div
                key={mod.id}
                className="module-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: mi * 0.04 }}
                style={{ "--mc": mod.color } as React.CSSProperties}
              >
                <div className="module-side">
                  <span className="module-dot">{modDone === modAll ? <Trophy size={18} /> : fa(mi + 1)}</span>
                </div>
                <div className="module-main">
                  <div className="module-head">
                    <div className="module-head-row">
                      <small>{mod.label}</small>
                      <small className="module-en" dir="ltr">{mod.en}</small>
                      <span className="module-count">{fa(modDone)} از {fa(modAll)} تکمیل</span>
                    </div>
                    <h3>{mod.title}</h3>
                    <p>{mod.tagline}</p>
                    <div className="module-progress" aria-hidden="true">
                      <span style={{ width: `${(modDone / modAll) * 100}%` }} />
                    </div>
                  </div>
                  <div className="module-lessons">
                    {filteredLessons.map((lesson) => {
                      const done = completed.includes(lesson.id);
                      const unlocked = isUnlocked(lesson.id);
                      const isNext = nextEntry?.lesson.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          className={`lesson-pill ${done ? "done" : ""} ${isNext ? "next" : ""} ${!unlocked ? "locked" : ""}`}
                          onClick={() => unlocked && onOpen(lesson.id)}
                          disabled={!unlocked}
                        >
                          <span className="pill-state">
                            {done ? <CheckCircle2 size={19} /> : unlocked ? <Play size={15} fill="currentColor" /> : <Lock size={15} />}
                          </span>
                          <span className="pill-body">
                            <strong>{lesson.title}</strong>
                            <small>
                              {fa(lesson.minutes)} دقیقه مطالعه و تمرین · {fa(lesson.steps.length)} بخش آموزشی
                              <span className="pill-kinds">
                                {[...new Set(lesson.steps.filter((s) => ["check", "fill", "order", "diagnose", "spot", "predict", "try"].includes(s.kind)).map((s) => s.kind))].map((kind) => {
                                  const meta = KIND_ICON[kind];
                                  const Icon = meta.icon;
                                  return <Icon key={kind} size={12.5} aria-label={meta.label} className="pill-kind-icon" data-tip={meta.label} />;
                                })}
                              </span>
                            </small>
                          </span>
                          {isNext && <span className="pill-badge">گام بعدی شما</span>}
                          {unlocked && <ArrowLeft size={17} className="pill-arrow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {doneCount === totalLessons && (
          <motion.div className="grad-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Trophy size={36} />
            <h3>🎉 تبریک، شما فارغ‌التحصیل رسمی بندرِ داکر شدید!</h3>
            <p>تمام {fa(totalLessons)} درس دوره را با حل چالش‌های عملی به پایان رساندید. اکنون زمان آن است که پروژه‌های شخصی و کاری خود را با استانداردهای مدرن کانتینری کنید.</p>
          </motion.div>
        )}
      </section>

      {onOpenLab && (
        <section className="lab-promo">
          <div className="lab-promo-glow" aria-hidden="true" />
          <div className="lab-promo-inner">
            <div className="lab-promo-text">
              <span className="lab-promo-badge"><FlaskConical size={14} /> جدید · یادگیری با انجام دادن</span>
              <h2>آزمایشگاه داکر</h2>
              <p>
                یک موتور Docker شبیه‌سازی‌شده داخل مرورگر. در پنج ماموریت واقعی، سرویس راه می‌اندازید،
                کانتینر خراب را عیب‌یابی می‌کنید، داده را با Volume نجات می‌دهید و شبکه اختصاصی می‌سازید.
                <b> اهداف هر ماموریت خودکار بررسی می‌شوند.</b>
              </p>
              <div className="lab-promo-tags">
                <span><Terminal size={13} /> ترمینال تعاملی</span>
                <span><Stethoscope size={13} /> سناریوی عیب‌یابی</span>
                <span><Target size={13} /> ۵ ماموریت مرحله‌ای</span>
              </div>
            </div>
            <button className="lab-promo-btn" onClick={onOpenLab}>
              <FlaskConical size={18} />
              ورود به آزمایشگاه
            </button>
          </div>
        </section>
      )}

      {onOpenCheatsheet && (
        <section className="cheat-promo">
          <div className="cheat-promo-text">
            <h2>دفترچه دستورات Docker</h2>
            <p>
              بیش از ۷۰ دستور پرکاربرد، دسته‌بندی‌شده و با توضیح فارسی — از چرخه عمر کانتینر تا Multi-stage و امنیت.
              یک کلیک و کپی، و همیشه در دسترس هنگام کار روی پروژه واقعی.
            </p>
          </div>
          <button className="cheat-promo-btn" onClick={onOpenCheatsheet}>
            <BookmarkMarked />
            باز کردن مرجع سریع
          </button>
        </section>
      )}

      <section className="faq-section" id="faq">
        <div className="faq-head">
          <HelpCircle size={22} />
          <h2>پرسش‌های پرتکرار شما</h2>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? "open" : ""}`}>
                <button className="faq-question" onClick={() => setActiveFaq(isOpen ? null : idx)}>
                  <span>{item.q}</span>
                  <span className="faq-icon">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="faq-answer"
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <Footer
        completed={completed}
        onOpen={onOpen}
        onOpenCheatsheet={onOpenCheatsheet}
        onOpenLab={onOpenLab}
        onResetProgress={onResetProgress}
      />

      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        completedLessonsCount={completed.length}
        onRestoreSuccess={(newCompleted) => onRestoreProgress?.(newCompleted)}
      />
    </div>
  );
}
