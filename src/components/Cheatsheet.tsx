import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, BookOpen, Boxes, Bug, Check, CheckCircle2,
  Code2, Container, Copy, Database, ExternalLink, FileCode2, Layers,
  LayoutGrid, Network, Search, ShieldCheck, Star, X, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cheatGroups } from "../data/reference";
import { copyText } from "../utils/clipboard";
import "./Cheatsheet.css";

const categoryIcons: Record<string, LucideIcon> = {
  lifecycle: Container,
  images: Layers,
  debug: Bug,
  storage: Database,
  network: Network,
  compose: Boxes,
  dockerfile: FileCode2,
  security: ShieldCheck,
};

const categoryAliases: Record<string, string> = {
  lifecycle: "کانتینر container",
  images: "ایمیج بیلد image build",
  debug: "دیباگ خطایابی debug",
  storage: "والیوم ولوم volume",
  network: "نتورک network",
  compose: "کامپوز compose",
  dockerfile: "داکرفایل dockerfile",
  security: "سکیوریتی security",
};

/* دستورهایی که هر روز استفاده می‌شوند — نوار دسترسی سریع */
const QUICK_COMMANDS = [
  "docker ps -a",
  "docker logs -f web",
  "docker exec -it web sh",
  "docker compose up -d",
  "docker compose down",
  "docker build -t app:1.0 .",
  "docker images",
  "docker system df",
];

const FAV_KEY = "bandar-docker-favs-v1";
const fa = (n: number) => n.toLocaleString("fa-IR");
const normalizeSearch = (value: string) => value.normalize("NFKC").toLowerCase()
  .replace(/[\u064a\u0649]/g, "ی").replace(/\u0643/g, "ک")
  .replace(/[\u064b-\u065f\u0670\u200c-\u200f]/g, "").trim();

function CommandSyntax({ command }: { command: string }) {
  return command.split(/(\s+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\$\([^)]*\))/g)
    .map((token, index) => {
      let tone = "";
      if (token === "docker" || /^[A-Z][A-Z_]*$/.test(token)) tone = "keyword";
      else if (/^--?[a-zA-Z]/.test(token)) tone = "flag";
      else if (/^["']/.test(token) || /^\$\(/.test(token)) tone = "value";
      return <span key={index} className={tone ? `cheat-token-${tone}` : undefined}>{token}</span>;
    });
}

function commandWarning(command: string) {
  if (/^docker volume (rm|prune)\b/.test(command) || /^docker compose down\b.*(?:-v|--volumes)/.test(command)) {
    return "این دستور می‌تواند داده‌های Volume را حذف کند. پیش از اجرا از داده‌های مهم پشتیبان بگیرید.";
  }
  if (/^docker rm -f \$/.test(command)) {
    return "این دستور تمام کانتینرها، از جمله کانتینرهای در حال اجرا را حذف می‌کند.";
  }
  if (/prune -a\b/.test(command)) {
    return "با -a همه ایمیج‌های بدون کانتینر حذف می‌شوند، نه فقط dangling. دانلود دوباره زمان‌بر است.";
  }
  return null;
}

type CopyFeedback = { id: string; success: boolean };

export function Cheatsheet({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyRequest = useRef(0);
  const entryScroll = useRef(window.scrollY);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }, [favs]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.isComposing || event.altKey) return;
      const target = event.target;
      const editing = target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']");
      if ((!editing && event.key === "/") || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => {
      window.removeEventListener("keydown", focusSearch);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyRequest.current += 1;
    };
  }, []);

  const toggleFav = (cmd: string) =>
    setFavs((list) => (list.includes(cmd) ? list.filter((c) => c !== cmd) : [...list, cmd]));

  const groups = useMemo(() => {
    const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
    return cheatGroups
      .filter((group) => category === "all" || category === "favs" || group.id === category)
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (category === "favs" && !favs.includes(item.cmd)) return false;
          const searchable = normalizeSearch(`${group.title} ${group.en} ${categoryAliases[group.id]} ${item.cmd} ${item.d}`);
          return terms.every((term) => searchable.includes(term));
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [query, category, favs]);

  const totalAll = useMemo(() => cheatGroups.reduce((n, g) => n + g.items.length, 0), []);
  const resultCount = groups.reduce((count, group) => count + group.items.length, 0);
  const hasFilters = query.trim().length > 0 || category !== "all";

  /* دستورهای پرکاربرد با توضیحاتشان از داده اصلی */
  const quickItems = useMemo(() => {
    const all = cheatGroups.flatMap((g) => g.items.map((it) => ({ ...it, gid: g.id, color: g.color })));
    return QUICK_COMMANDS.map((cmd) => all.find((it) => it.cmd === cmd)).filter(Boolean) as (typeof all)[number][];
  }, []);

  const copy = async (id: string, command: string) => {
    const request = ++copyRequest.current;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    const success = await copyText(command);
    if (request !== copyRequest.current) return;
    setFeedback({ id, success });
    copyTimer.current = setTimeout(() => setFeedback(null), success ? 2200 : 4500);
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    searchRef.current?.focus();
  };

  const goBack = () => {
    onBack();
    requestAnimationFrame(() => window.scrollTo({ top: entryScroll.current, behavior: "instant" }));
  };

  const jumpToGroup = (id: string) => {
    setCategory("all");
    requestAnimationFrame(() => {
      document.getElementById(`notebook-group-${id}`)?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    });
  };

  const showQuick = !hasFilters;

  return (
    <div className="cheatsheet" dir="rtl">
      <header className="cheat-topbar">
        <div className="cheat-topbar-inner">
          <div className="cheat-heading-lockup">
            <button type="button" className="cheat-back" onClick={goBack} aria-label="بازگشت به نقشه دوره" title="بازگشت به دوره">
              <ArrowRight size={19} />
            </button>
            <div className="cheat-page-title">
              <span>بندرِ داکر <span aria-hidden="true">/</span> مرجع سریع</span>
              <strong>دفترچه دستورات <bdi>Docker</bdi></strong>
            </div>
          </div>
          <form className="cheat-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <Search size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setQuery("");
                }
              }}
              placeholder="جستجوی دستور یا کاربرد آن..."
              aria-label="جستجو در دفترچه دستورات"
              aria-controls="notebook-commands"
              aria-keyshortcuts="/ Control+k Meta+k"
              autoComplete="off"
              spellCheck={false}
            />
            {query ? (
              <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="پاک کردن جستجو">
                <X size={16} />
              </button>
            ) : <kbd aria-hidden="true">/</kbd>}
          </form>
        </div>

        {/* نوار دسته‌بندی‌ها */}
        <nav className="cheat-cat-rail" aria-label="دسته‌بندی دستورها">
          <div className="cheat-cat-rail-inner">
            <button
              type="button"
              className={`cheat-cat-pill${category === "all" ? " active" : ""}`}
              onClick={() => setCategory("all")}
              style={{ "--pc": "#0f1f33" } as CSSProperties}
            >
              <LayoutGrid size={14} />
              <span>همه</span>
              <b>{fa(totalAll)}</b>
            </button>
            <button
              type="button"
              className={`cheat-cat-pill fav-pill${category === "favs" ? " active" : ""}`}
              onClick={() => setCategory("favs")}
              style={{ "--pc": "#d97706" } as CSSProperties}
              disabled={favs.length === 0}
              title={favs.length === 0 ? "با ستاره کنار هر دستور، آن را برگزیده کنید" : undefined}
            >
              <Star size={14} fill={favs.length > 0 ? "currentColor" : "none"} />
              <span>برگزیده‌ها</span>
              <b>{fa(favs.length)}</b>
            </button>
            <span className="cheat-cat-sep" aria-hidden="true" />
            {cheatGroups.map((g) => {
              const Icon = categoryIcons[g.id] || BookOpen;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`cheat-cat-pill${category === g.id ? " active" : ""}`}
                  onClick={() => setCategory(category === g.id ? "all" : g.id)}
                  onDoubleClick={() => jumpToGroup(g.id)}
                  style={{ "--pc": g.color } as CSSProperties}
                  title={`${g.en} — دوبار کلیک: پرش به بخش`}
                >
                  <Icon size={14} />
                  <span>{g.title}</span>
                  <b>{fa(g.items.length)}</b>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="cheat-body">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.32 }}
          className="cheat-intro"
        >
          <h1>دستورهای <bdi>Docker</bdi>، همیشه دم دست.</h1>
          <p>
            جستجو کنید، با ستاره برگزیده کنید و با یک کلیک کپی کنید. دسته‌ها را از نوار بالا فیلتر کنید یا با <kbd>/</kbd> مستقیماً بنویسید.
          </p>
        </motion.div>

        {/* نوار پرکاربردترین‌ها */}
        {showQuick && quickItems.length > 0 && (
          <motion.section
            className="cheat-quick"
            aria-labelledby="cheat-quick-title"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.06 }}
          >
            <div className="cheat-quick-head">
              <Zap size={15} />
              <h2 id="cheat-quick-title">پرکاربردترین‌های روزمره</h2>
              <span>هشت دستوری که بیشترین تکرار را در کار واقعی دارند</span>
            </div>
            <div className="cheat-quick-grid">
              {quickItems.map((it) => {
                const id = `quick:${it.cmd}`;
                const copied = feedback?.id === id && feedback.success;
                return (
                  <button
                    key={it.cmd}
                    type="button"
                    className={`cheat-quick-item${copied ? " is-copied" : ""}`}
                    style={{ "--qc": it.color } as CSSProperties}
                    onClick={() => void copy(id, it.cmd)}
                    aria-label={`کپی: ${it.cmd}`}
                  >
                    <code dir="ltr"><span className="cheat-quick-prompt" aria-hidden="true">$</span><CommandSyntax command={it.cmd} /></code>
                    <small>{it.d}</small>
                    <span className="cheat-quick-copy">{copied ? <Check size={13} /> : <Copy size={13} />}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}

        <div className="cheat-toolbar">
          <p className="cheat-results-meta" role="status" aria-live="polite" aria-atomic="true">
            <strong>{fa(resultCount)}</strong> دستور در <strong>{fa(groups.length)}</strong> دسته
            {category === "favs" && <span className="cheat-meta-note"> · فقط برگزیده‌های شما</span>}
          </p>
          {hasFilters && (
            <button type="button" className="cheat-reset" onClick={resetFilters}>
              <X size={13} /> حذف فیلترها
            </button>
          )}
        </div>

        <div id="notebook-commands" className="cheat-grid" tabIndex={-1}>
          {groups.map((group, groupIndex) => {
            const Icon = categoryIcons[group.id] || BookOpen;
            return (
              <motion.section
                key={group.id}
                id={`notebook-group-${group.id}`}
                className="cheat-group"
                aria-labelledby={`notebook-heading-${group.id}`}
                style={{ "--gc": group.color } as CSSProperties}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px 80px 0px" }}
                transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : (groupIndex % 2) * 0.045 }}
              >
                <header className="cheat-group-head">
                  <div className="cheat-category-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.8} /></div>
                  <div className="cheat-category-title">
                    <h2 id={`notebook-heading-${group.id}`}>{group.title}</h2>
                    <span dir="ltr" lang="en">{group.en}</span>
                  </div>
                  <span className="cheat-group-count">{fa(group.items.length)} دستور</span>
                </header>
                <ul className="cheat-items">
                  {group.items.map((item, index) => {
                    const id = `${group.id}:${item.cmd}`;
                    const copied = feedback?.id === id && feedback.success;
                    const failed = feedback?.id === id && !feedback.success;
                    const isShell = item.cmd.startsWith("docker ");
                    const warning = commandWarning(item.cmd);
                    const isFav = favs.includes(item.cmd);
                    return (
                      <li key={item.cmd} className={`cheat-item${copied ? " is-copied" : ""}${isFav ? " is-fav" : ""}`}>
                        <div className="cheat-description-row">
                          <p id={`notebook-desc-${group.id}-${index}`} className="cheat-desc">{item.d}</p>
                          <div className="cheat-row-actions">
                            <button
                              type="button"
                              className={`cheat-fav${isFav ? " on" : ""}`}
                              onClick={() => toggleFav(item.cmd)}
                              aria-pressed={isFav}
                              aria-label={isFav ? "حذف از برگزیده‌ها" : "افزودن به برگزیده‌ها"}
                              title={isFav ? "حذف از برگزیده‌ها" : "افزودن به برگزیده‌ها"}
                            >
                              <Star size={14} fill={isFav ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </div>
                        {warning && (
                          <div className="cheat-warning-alert" role="alert">
                            <AlertTriangle size={13} className="cwa-icon" aria-hidden="true" />
                            <span className="cwa-text">{warning}</span>
                          </div>
                        )}
                        <div className="cheat-command" dir="ltr">
                          <span className="cheat-prompt" aria-hidden="true">{isShell ? "$" : <Code2 size={14} />}</span>
                          <pre className="cheat-cmd"><code><CommandSyntax command={item.cmd} /></code></pre>
                          <button
                            type="button"
                            className={`cheat-copy${copied ? " is-copied" : ""}${failed ? " has-error" : ""}`}
                            onClick={() => void copy(id, item.cmd)}
                            aria-label={copied ? "کپی شد" : `کپی کد: ${item.cmd}`}
                            aria-describedby={`notebook-desc-${group.id}-${index}`}
                          >
                            {copied ? <Check size={16} /> : <Copy size={15} />}
                            <span className="cheat-copy-tooltip" dir="rtl" aria-hidden="true">{copied ? "کپی شد" : failed ? "کپی نشد" : "کپی کد"}</span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.section>
            );
          })}
        </div>

        {groups.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cheat-empty">
            {category === "favs" ? <Star size={30} strokeWidth={1.5} aria-hidden="true" /> : <Search size={30} strokeWidth={1.5} aria-hidden="true" />}
            <h2>{category === "favs" ? "هنوز دستوری برگزیده نکرده‌اید." : "دستور مورد نظرتان پیدا نشد."}</h2>
            <p>
              {category === "favs"
                ? "روی ستاره کنار هر دستور کلیک کنید تا اینجا جمع شوند — مثل یک دفترچه شخصی."
                : <>عبارت کوتاه‌تری مثل <bdi>logs</bdi> یا <bdi>volume</bdi> را امتحان کنید، یا دسته‌بندی را تغییر دهید.</>}
            </p>
            <button type="button" onClick={resetFilters}>نمایش همه دستورها <ArrowRight size={15} /></button>
          </motion.div>
        )}

        <footer className="cheat-footer">
          <p>این صفحه دستوری اجرا نمی‌کند؛ نام‌ها و مسیرها را پیش از استفاده با پروژه خودتان تطبیق دهید. برگزیده‌ها فقط در همین مرورگر ذخیره می‌شوند.</p>
          <a href="https://docs.docker.com/reference/cli/docker/" target="_blank" rel="noreferrer">
            مرجع رسمی Docker <ExternalLink size={13} aria-hidden="true" />
          </a>
        </footer>
      </main>

      <div className="cheat-feedback-region" role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.id}
              className={`cheat-feedback${feedback.success ? "" : " is-error"}`}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              {feedback.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedback.success ? "کد در کلیپ‌بورد کپی شد." : "کپی انجام نشد؛ متن کد را دستی انتخاب کنید."}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
