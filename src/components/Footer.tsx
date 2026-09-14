import { useState } from "react";
import {
  BookOpenCheck,
  FlaskConical,
  Play,
  ArrowUp,
  ExternalLink,
  Copy,
  Check,
  Layers,
  ChevronLeft,
  HelpCircle,
  Boxes,
} from "lucide-react";
import { allLessons, course } from "../data/course";
import { copyText } from "../utils/clipboard";
import "./Footer.css";

const fa = (n: number | string) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export interface FooterProps {
  completed: string[];
  onOpen: (id: string) => void;
  onOpenCheatsheet?: () => void;
  onOpenLab?: () => void;
  onResetProgress?: () => void;
}

export function Footer({
  completed,
  onOpen,
  onOpenCheatsheet,
  onOpenLab,
}: FooterProps) {
  const [copied, setCopied] = useState(false);
  const [whaleClicked, setWhaleClicked] = useState(false);

  const totalLessons = allLessons.length;
  const doneCount = completed.length;
  const pct = Math.round((doneCount / totalLessons) * 100);
  const nextEntry = allLessons.find((e) => !completed.includes(e.lesson.id));

  const SAMPLE_CMD = "docker run -d -p 80:80 harbor";

  const handleCopy = async () => {
    const ok = await copyText(SAMPLE_CMD);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhaleClick = () => {
    setWhaleClicked(true);
    setTimeout(() => setWhaleClicked(false), 2800);
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bnd-footer" role="contentinfo" dir="rtl">
      {/* بافت ملایم شب ساحلی */}
      <div className="bnd-footer-bg" aria-hidden="true" />

      {/* نوار رنگی پاستلی در لبه بالای فوتر */}
      <div className="bnd-footer-strip" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>

      {/* ── اسکله آرام: نهنگ داکر و المان‌های بامزه روی آب ── */}
      <div className="bnd-calm-stage" aria-hidden="true">
        {/* کانتینرهای کوچک سمت راست */}
        <div className="bnd-calm-boxes">
          <span className="bnd-mini-box bnd-mb-1" />
          <span className="bnd-mini-box bnd-mb-2" />
          <span className="bnd-mini-box bnd-mb-3" />
        </div>

        {/* نهنگ مهربان داکر در مرکز با تعامل کلیک */}
        <div
          className="bnd-cute-whale"
          onClick={handleWhaleClick}
          role="button"
          tabIndex={0}
          title="روی نهنگ کلیک کن! 🐳"
        >
          {whaleClicked && (
            <span className="bnd-cute-bubble">🐳یو مهندس، خسته نباشی و دمتم جیز </span>
          )}
          <span className="bnd-whale-spout" />
          <div className="bnd-whale-body">
            <span className="bnd-whale-eye" />
            <div className="bnd-whale-boxes">
              <span className="bnd-whale-box bnd-wb-1" />
              <span className="bnd-whale-box bnd-wb-2" />
              <span className="bnd-whale-box bnd-wb-3" />
            </div>
          </div>
        </div>

        {/* قایق کوچک شناور در سمت چپ */}
        <div className="bnd-calm-boat">
          <span className="bnd-cboat-box" />
          <span className="bnd-cboat-hull" />
        </div>
      </div>

      {/* امواج ملایم */}
      <div className="bnd-footer-waves" aria-hidden="true">
        <span className="bnd-gentle-wave bnd-wave-1" />
        <span className="bnd-gentle-wave bnd-wave-2" />
      </div>

      <div className="bnd-footer-inner">
        <div className="bnd-footer-grid">
          {/* ── ستون ۱: هویت برند و پیام صمیمی ── */}
          <div className="bnd-brand-col">
            <div className="bnd-brand-header">
              <span className="bnd-brand-cube" aria-hidden="true">
                <i /><i /><i />
              </span>
              <div className="bnd-brand-names">
                <strong>بندرِ داکر</strong>
                <small dir="ltr">Docker Harbor</small>
              </div>
            </div>

            <p className="bnd-brand-desc">
              یک محیط یادگیری آرام، تعاملی و بدون استرس برای تسلط بر Docker.
              تمام سناریوها درون مرورگر اجرا می‌شوند، پس با خیال راحت تمرین کن!
            </p>

            <div className="bnd-calm-status">
              <span className="bnd-pulse-dot" />
              <span>شبیه‌ساز آماده تمرین • بدون نیاز به نصب</span>
            </div>
          </div>

          {/* ── ستون ۲: سرفصل‌های آموزشی ── */}
          <div className="bnd-col">
            <h3 className="bnd-col-title">
              <Layers size={16} aria-hidden="true" />
              <span>سرفصل‌های دوره</span>
              <span className="bnd-col-badge">{fa(course.length)} فصل</span>
            </h3>

            <ul className="bnd-link-list">
              {course.map((mod, idx) => (
                <li key={mod.id}>
                  <button
                    type="button"
                    className="bnd-module-btn"
                    style={{ "--mc": mod.color } as React.CSSProperties}
                    onClick={() => onOpen(mod.lessons[0].id)}
                  >
                    <span className="bnd-mod-num">{fa(idx + 1)}</span>
                    <span className="bnd-mod-text">{mod.title}</span>
                    <ChevronLeft size={14} className="bnd-mod-arrow rtl:rotate-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── ستون ۳: ابزارها و مراجع سریع ── */}
          <div className="bnd-col">
            <h3 className="bnd-col-title">
              <FlaskConical size={16} aria-hidden="true" />
              <span>ابزارها و مراجع</span>
            </h3>

            <ul className="bnd-link-list">
              {onOpenLab && (
                <li>
                  <button type="button" className="bnd-tool-link" onClick={onOpenLab}>
                    <FlaskConical size={15} className="bnd-tool-icon" aria-hidden="true" />
                    <span className="bnd-tool-title">آزمایشگاه تعاملی داکر</span>
                    <span className="bnd-soft-pill">محیط زنده</span>
                  </button>
                </li>
              )}

              {onOpenCheatsheet && (
                <li>
                  <button type="button" className="bnd-tool-link" onClick={onOpenCheatsheet}>
                    <BookOpenCheck size={15} className="bnd-tool-icon" aria-hidden="true" />
                    <span className="bnd-tool-title">دفترچه دستورات داکر</span>
                  </button>
                </li>
              )}

              <li>
                <a
                  href="#course"
                  className="bnd-tool-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("course")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Layers size={15} className="bnd-tool-icon" aria-hidden="true" />
                  <span className="bnd-tool-title">نقشه مسیر یادگیری</span>
                </a>
              </li>

              <li>
                <a
                  href="#faq"
                  className="bnd-tool-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <HelpCircle size={15} className="bnd-tool-icon" aria-hidden="true" />
                  <span className="bnd-tool-title">پرسش‌های پرتکرار (FAQ)</span>
                </a>
              </li>

              <li>
                <a
                  href="https://docs.docker.com"
                  target="_blank"
                  rel="noreferrer"
                  className="bnd-tool-link"
                >
                  <ExternalLink size={15} className="bnd-tool-icon" aria-hidden="true" />
                  <span className="bnd-tool-title">مستندات رسمی Docker Docs</span>
                </a>
              </li>

              <li>
                <a
                  href="https://hub.docker.com"
                  target="_blank"
                  rel="noreferrer"
                  className="bnd-tool-link"
                >
                  <Boxes size={15} className="bnd-tool-icon" aria-hidden="true" />
                  <span className="bnd-tool-title">مخزن کانتینرهای Docker Hub</span>
                </a>
              </li>
            </ul>
          </div>

          {/* ── ستون ۴: کارت پیشرفت نرم و دلنشین ── */}
          <div className="bnd-progress-card">
            <div className="bnd-pcard-header">
              <div className="bnd-donut-wrapper">
                <div
                  className="bnd-donut"
                  style={{ "--p": `${pct}%` } as React.CSSProperties}
                  aria-label={`پیشرفت شما: ${fa(pct)} درصد`}
                >
                  <b>{fa(pct)}٪</b>
                </div>
                <div className="bnd-pcard-copy">
                  <b>{fa(doneCount)} از {fa(totalLessons)} درس</b>
                  <small>
                    {doneCount === totalLessons
                      ? "دوره کامل شد — آفرین! 🎉"
                      : doneCount === 0
                      ? "شروع یک مسیر هیجان‌انگیز ✨"
                      : "هر روز یک قدم به جلو! 🌱"}
                  </small>
                </div>
              </div>
            </div>

            <div className="bnd-pcard-next">
              <span>گام بعدی:</span>
              <strong>
                {nextEntry ? nextEntry.lesson.title : "مرور سرفصل‌ها و تمرین آزاد"}
              </strong>
            </div>

            <button
              type="button"
              className="bnd-cta-btn"
              onClick={() => {
                if (nextEntry) {
                  onOpen(nextEntry.lesson.id);
                } else if (allLessons.length > 0) {
                  onOpen(allLessons[0].lesson.id);
                }
              }}
            >
              <Play size={15} fill="currentColor" aria-hidden="true" />
              <span>
                {doneCount === totalLessons
                  ? "مرور کامل دوره"
                  : doneCount === 0
                  ? "شروع اولین درس"
                  : "ادامه یادگیری"}
              </span>
            </button>

            {/* چیپ دستور کپی‌شونده آرام */}
            <div className="bnd-quick-cmd" dir="ltr">
              <span className="bnd-qcmd-text">$ {SAMPLE_CMD}</span>
              <button
                type="button"
                className={`bnd-qcmd-copy ${copied ? "copied" : ""}`}
                onClick={handleCopy}
                title="کپی دستور"
                aria-label="کپی دستور"
              >
                {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                <span className="bnd-qcmd-label">{copied ? "کپی شد" : "کپی"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── نوار پایانی (Sub-footer) ── */}
        <div className="bnd-footer-bottom">
          <div className="bnd-bottom-info">
            <span> 1985 بندرِ داکر — پلتفرم یادگیری تعاملی Docker</span>
          </div>

          <div className="bnd-credit">
            <span>Long May The Sunshine</span>
            <i className="bnd-heart" aria-hidden="true"></i>
            <span></span>
          </div>

          <button
            type="button"
            className="bnd-top-btn"
            onClick={handleScrollTop}
            aria-label="بازگشت به بالای صفحه"
          >
            <ArrowUp size={14} aria-hidden="true" />
            <span>بازگشت به بالا</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
