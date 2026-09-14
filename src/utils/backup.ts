/* ══════════════════════════════════════════════════════════
   مدیریت پشتیبان‌گیری و بازیابی پیشرفت یادگیری بندرِ داکر
   ══════════════════════════════════════════════════════════ */

export const STORAGE_KEYS = {
  lessons: "bandar-docker-progress-v1",
  labMissions: "bandar-docker-lab-v1",
  labActive: "bandar-docker-lab-active-v1",
  cheatsheetFavs: "bandar-docker-favs-v1",
} as const;

export type BackupPayload = {
  app: "bandar-docker";
  version: "1.0";
  exportedAt: string;
  data: {
    completedLessons: string[];
    completedMissions: string[];
    activeMissionId: string | null;
    favoriteCommands: string[];
  };
};

/** خواندن ایمن داده‌های فعلی از localStorage */
export function getCurrentBackupData(): BackupPayload {
  let completedLessons: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.lessons);
    if (raw) completedLessons = JSON.parse(raw);
  } catch {
    completedLessons = [];
  }

  let completedMissions: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.labMissions);
    if (raw) completedMissions = JSON.parse(raw);
  } catch {
    completedMissions = [];
  }

  let activeMissionId: string | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.labActive);
    if (raw) activeMissionId = JSON.parse(raw);
  } catch {
    activeMissionId = null;
  }

  let favoriteCommands: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cheatsheetFavs);
    if (raw) favoriteCommands = JSON.parse(raw);
  } catch {
    favoriteCommands = [];
  }

  return {
    app: "bandar-docker",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      completedLessons: Array.isArray(completedLessons) ? completedLessons : [],
      completedMissions: Array.isArray(completedMissions) ? completedMissions : [],
      activeMissionId: typeof activeMissionId === "string" ? activeMissionId : null,
      favoriteCommands: Array.isArray(favoriteCommands) ? favoriteCommands : [],
    },
  };
}

/** دانلود فایل بک‌آپ به فرمت JSON روی دستگاه کاربر */
export function downloadBackupFile(backup?: BackupPayload): void {
  const payload = backup || getCurrentBackupData();
  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bandar-docker-backup-${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export type ValidationResult =
  | { success: true; payload: BackupPayload }
  | { success: false; error: string };

/** اعتبارسنجی فایل آپلودشده جهت جلوگیری از خرابی داده‌ها */
export function validateAndParseBackup(rawText: string): ValidationResult {
  if (!rawText || !rawText.trim()) {
    return { success: false, error: "فایل انتخاب‌شده خالی است." };
  }

  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "فرمت فایل نامعتبر است (شیء JSON یافت نشد)." };
    }

    // پشتیبانی از ساختار استاندارد یا ساختار ساده قبلی
    let lessons: unknown = parsed?.data?.completedLessons;
    let missions: unknown = parsed?.data?.completedMissions;
    let activeId: unknown = parsed?.data?.activeMissionId;
    let favs: unknown = parsed?.data?.favoriteCommands;

    // اگر فرمت فایل فلت ذخیره شده بود
    if (!lessons && Array.isArray(parsed.completedLessons)) {
      lessons = parsed.completedLessons;
    } else if (!lessons && Array.isArray(parsed.completed)) {
      lessons = parsed.completed;
    }

    if (!Array.isArray(lessons)) {
      return {
        success: false,
        error: "فایل فاقد لیست معتبر درس‌های تکمیل‌شده (completedLessons) است.",
      };
    }

    // اعتبارسنجی آرایه شناسه‌ها
    const cleanLessons = lessons.filter((item): item is string => typeof item === "string");

    const cleanMissions = Array.isArray(missions)
      ? missions.filter((item): item is string => typeof item === "string")
      : [];

    const cleanFavs = Array.isArray(favs)
      ? favs.filter((item): item is string => typeof item === "string")
      : [];

    const cleanActiveId = typeof activeId === "string" ? activeId : null;

    const validatedPayload: BackupPayload = {
      app: "bandar-docker",
      version: "1.0",
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      data: {
        completedLessons: cleanLessons,
        completedMissions: cleanMissions,
        activeMissionId: cleanActiveId,
        favoriteCommands: cleanFavs,
      },
    };

    return { success: true, payload: validatedPayload };
  } catch {
    return {
      success: false,
      error: "خطا در تجزیه JSON. فایل خراب است یا فرمت مناسبی ندارد.",
    };
  }
}

/** اعمال داده‌های بازیابی‌شده روی localStorage */
export function applyBackupToStorage(payload: BackupPayload): boolean {
  try {
    localStorage.setItem(
      STORAGE_KEYS.lessons,
      JSON.stringify(payload.data.completedLessons)
    );
    localStorage.setItem(
      STORAGE_KEYS.labMissions,
      JSON.stringify(payload.data.completedMissions)
    );
    if (payload.data.activeMissionId) {
      localStorage.setItem(
        STORAGE_KEYS.labActive,
        JSON.stringify(payload.data.activeMissionId)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.labActive);
    }
    localStorage.setItem(
      STORAGE_KEYS.cheatsheetFavs,
      JSON.stringify(payload.data.favoriteCommands)
    );
    return true;
  } catch {
    return false;
  }
}
