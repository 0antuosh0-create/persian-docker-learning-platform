import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Upload,
  FolderSync,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpenCheck,
  FlaskConical,
  Star,
} from "lucide-react";
import {
  applyBackupToStorage,
  downloadBackupFile,
  getCurrentBackupData,
  validateAndParseBackup,
} from "../utils/backup";
import "./BackupModal.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedLessonsCount: number;
  onRestoreSuccess: (newCompleted: string[]) => void;
}

type Feedback = {
  type: "success" | "error";
  message: string;
};

export function BackupModal({
  isOpen,
  onClose,
  completedLessonsCount,
  onRestoreSuccess,
}: BackupModalProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // بستن با کلید Escape
  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentData = getCurrentBackupData();
  const missionsCount = currentData.data.completedMissions.length;
  const favsCount = currentData.data.favoriteCommands.length;

  const handleExport = () => {
    try {
      downloadBackupFile();
      setFeedback({
        type: "success",
        message: "فایل پشتیبان با موفقیت تولید و دانلود شد.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "خطا در تولید فایل پشتیبان. لطفاً مجدداً تلاش کنید.",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") {
        setFeedback({
          type: "error",
          message: "خطا در خواندن فایل انتخاب‌شده.",
        });
        return;
      }

      const result = validateAndParseBackup(content);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error,
        });
        return;
      }

      const applied = applyBackupToStorage(result.payload);
      if (!applied) {
        setFeedback({
          type: "error",
          message: "ذخیره اطلاعات روی مرورگر با خطا مواجه شد.",
        });
        return;
      }

      onRestoreSuccess(result.payload.data.completedLessons);
      setFeedback({
        type: "success",
        message: `پیشرفت شما با موفقیت بازیابی شد! (${fa(
          result.payload.data.completedLessons.length
        )} درس و ${fa(result.payload.data.completedMissions.length)} ماموریت فعال شد)`,
      });
    };

    reader.onerror = () => {
      setFeedback({
        type: "error",
        message: "خطا در بارگذاری فایل از روی دستگاه.",
      });
    };

    reader.readAsText(file);
    // ریست فیلد برای امکان انتخاب مجدد همان فایل
    e.target.value = "";
  };

  return (
    <div
      className="backup-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <motion.div
        className="backup-modal"
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="backup-modal-head">
          <div className="backup-modal-title-group">
            <div className="backup-modal-icon" aria-hidden="true">
              <FolderSync size={22} />
            </div>
            <div className="backup-modal-texts">
              <h2 id="backup-modal-title">پشتیبان‌گیری و بازیابی پیشرفت</h2>
              <p>انتقال امن سوابق دوره و آزمایشگاه به دستگاه یا مرورگر دیگر</p>
            </div>
          </div>

          <button
            type="button"
            className="backup-modal-close"
            onClick={onClose}
            aria-label="بستن پنجره"
            title="بستن"
          >
            <X size={17} />
          </button>
        </div>

        <div className="backup-modal-body">
          {/* کارت ۱: خروجی گرفتن */}
          <div className="backup-card">
            <div className="backup-card-head">
              <div className="backup-card-icon" aria-hidden="true">
                <Download size={16} />
              </div>
              <h3>ذخیره فایل پشتیبان (Export)</h3>
            </div>

            <p className="backup-card-desc">
              دانلود تمام سوابق یادگیری، درس‌های گذرانده‌شده و ماموریت‌های
              آزمایشگاه در قالب یک فایل JSON.
            </p>

            <div className="backup-card-meta">
              <span>
                <BookOpenCheck size={14} aria-hidden="true" />
                {fa(completedLessonsCount)} درس
              </span>
              <span>•</span>
              <span>
                <FlaskConical size={14} aria-hidden="true" />
                {fa(missionsCount)} ماموریت
              </span>
              <span>•</span>
              <span>
                <Star size={14} aria-hidden="true" />
                {fa(favsCount)} برگزیده
              </span>
            </div>

            <button
              type="button"
              className="backup-btn-export"
              onClick={handleExport}
            >
              <Download size={16} aria-hidden="true" />
              <span>دانلود فایل پشتیبان (json)</span>
            </button>
          </div>

          {/* کارت ۲: بازیابی از فایل */}
          <div className="backup-card">
            <div className="backup-card-head">
              <div className="backup-card-icon import" aria-hidden="true">
                <Upload size={16} />
              </div>
              <h3>بازیابی از فایل (Import)</h3>
            </div>

            <p className="backup-card-desc">
              فایل JSON قبلی خود را انتخاب کنید تا وضعیت دوره و کدهای شما دقیقاً
              از همان‌جایی که بودید بازنشانی شود.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleFileChange}
              aria-label="انتخاب فایل پشتیبان JSON"
            />

            <button
              type="button"
              className="backup-btn-import"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} aria-hidden="true" />
              <span>انتخاب و بارگذاری فایل JSON</span>
            </button>
          </div>
        </div>

        {/* بازخورد عملیات (Toast / Alert) */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              className={`backup-toast ${feedback.type}`}
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                <AlertCircle size={18} aria-hidden="true" />
              )}
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
