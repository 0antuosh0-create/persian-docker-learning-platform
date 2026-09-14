# ⚓ بندرِ داکر (Docker Harbor)
### پلتفرم جامع، تعاملی و سناریومحور یادگیری مهندسی Docker به زبان فارسی

[![دموی زنده در گیت‌هاب پیجز](https://img.shields.io/badge/دموی_زنده-GitHub_Pages-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://0antuosh0-create.github.io/persian-docker-learning-platform/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/مجوز-MIT-green.svg?style=for-the-badge)](./LICENSE)

[🌐 **View English Documentation (README.md)**](./README.md)

---

## 🌊 درباره پروژه

**بندرِ داکر (Docker Harbor)** یک پلتفرم متن‌باز و تعاملی برای آموزش عمیق و عملیاتی مفاهیم Docker به مهندسان نرم‌افزار، توسعه‌دهندگان و متخصصان DevOps فارسی‌زبان است.

برخلاف آموزش‌های تئوری و مقالات متنی، این پلتفرم بر پایه فلسفه **«یادگیری با دست و تجربه عملی»** ساخته شده است. این پروژه مجهز به یک **موتور شبیه‌ساز واقعی داکر درون مرورگر** است که به شما امکان می‌دهد دستورات را اجرا کنید، چرخه عمر کانتینرها را بررسی نمایید، ایمیج بسازید، شبکه‌ها را پیکربندی کنید و حوادث دنیای واقعی را حل کنید — بدون نیاز به هیچ سرور خارجی و حتی بدون نیاز به نصب Docker Desktop روی رایانه شما.

---

## ✨ ویژگی‌های کلیدی پلتفرم

- **🚀 ۱۶ درس جامع مهندسی در قالب ۶ فصل تخصصی:**
  ۱. **دنیای کانتینرها:** مقایسه ماشین مجازی با کانتینر، فضاهای نام لینوکس (Namespaces)، گروه‌های کنترل (Cgroups) و مفاهیم پایه.
  ۲. **کارخانه Image:** لایه‌بندی سیستم‌فایل OverlayFS، مکانیک باطل شدن کش در BuildKit، تگ‌گذاری و هش‌های تغییرناپذیر (Digest).
  ۳. **داده و شبکه:** ذخیره‌سازی داده با دور زدن لایه کپی در نوشتن (CoW)، تفاوت Named Volume و Bind Mount، و معماری DNS داخلی داکر (`127.0.0.11`).
  ۴. **ارکستراسیون با Docker Compose:** سینتکس استاندارد `compose.yaml`، آزمون‌های سلامت پیشرفته (Healthcheck)، شرط `service_healthy` و مدیریت محرمانه‌ها (Secrets).
  ۵. **پروداکشن و امنیت سازمانی:** ایمیج‌های چندمرحله‌ای (Multi-Stage)، کاهش حجم از ۱ گیگابایت به ۳۰ مگابایت، بیس‌های Distroless و کاربر غیر ریشه.
  ۶. **عملیات و پایداری:** مهار کرش سرور با Linux OOM Killer (`Exit Code 137`)، سقف رم و پردازنده، چرخش لاگ‌ها، و تله سیگنال‌های PID 1 لینوکس در خاموشی آرام.

- **💻 آزمایشگاه زنده داکر (Interactive Docker Lab):**
  - شبیه‌ساز موتور داکر با ذخیره وضعیت محیط (Stateful Simulation).
  - پایانه خط فرمان کاملاً انگلیسی با تجربه کاربری توسعه‌دهنده (CLI).
  - بررسی خودکار اهداف سناریو به محض اجرای دستور صحیح.
  - تاریخچه دستورات، تکمیل خودکار با Tab و خط وضعیت سبک tmux.

- **📑 دفترچه دستورات و مرجع سریع (Command Cheatsheet):**
  - دسته‌بندی موضوعی تمام دستورات حیاتی داکر همراه با نکات مهندسی پروداکشن.
  - کپی آنی دستورات با یک کلیک و فیدبک بصری.
  - قابلیت نشان‌کردن (ستاره‌دار کردن) دستورات پرکاربرد شخصی.
  - فیلتر آنی و جستجوی هوشمند با کلید میانبر `/` یا `Ctrl+K`.
  - هشدارهای ایمنی اختصاصی برای دستورات مخرب داکر (مانند حذف والیوم یا کانتینرها).

- **💾 پشتیبان‌گیری و بازیابی پیشرفت (Backup & Restore):**
  - امکان خروجی گرفتن و دانلود تمام سوابق یادگیری و ماموریت‌ها در قالب یک فایل استاندارد `.json`.
  - قابلیت بارگذاری و بازگردانی پیشرفت روی هر سیستم، دستگاه یا مرورگر دیگر با اعتبارسنجی خودکار ساختار داده.

- **🎨 هویت بصری مدرن و تم ساحلی نئوبروتالیست:**
  - زبان بصری الهام‌گرفته از اسکله، کانتینرهای باربری و ترمینال‌های مهندسی.
  - تایپوگرافی تمیز فارسی با فونت استاندارد **وزیرمتن (Vazirmatn)** و کدها با **JetBrains Mono** و **Fira Code**.
  - طراحی کاملاً واکنش‌گرا (ریسپانسیو) برای دسکتاپ، تبلت و موبایل.

---

## 🛠 ابزارها و فناوری‌ها (Tech Stack)

- **فریم‌ورک فرانت‌اند:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **موتور باندل و ابزار ساخت:** [Vite 7](https://vite.dev/) + [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)
- **استایل‌دهی:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS اختصاصی ماژولار
- **انیمیشن‌ها:** [Framer Motion](https://motion.dev/)
- **مجموعه آیکون‌ها:** [Lucide React](https://lucide.dev/)
- **تایپوگرافی:** [Vazirmatn](https://github.com/rastikerdar/vazirmatn)، [JetBrains Mono](https://www.jetbrains.com/lp/mono/)، [Fira Code](https://github.com/tonsky/FiraCode)

---

## 🚀 راه‌اندازی و اجرای محلی (Local Development)

### پیش‌نیازها

- [Node.js](https://nodejs.org/) (نسخه ۱۸ یا بالاتر)
- پکیج‌منیجر [npm](https://www.npmjs.com/) یا [pnpm](https://pnpm.io/)

### مراحل نصب

۱. **کلون کردن مخزن گیت:**
   ```bash
   git clone https://github.com/0antuosh0-create/persian-docker-learning-platform.git
   cd persian-docker-learning-platform
   ```

۲. **نصب پکیج‌ها و وابستگی‌ها:**
   ```bash
   npm install
   ```

۳. **اجرای سرور توسعه محلی:**
   ```bash
   npm run dev
   ```
   سپس آدرس [http://localhost:5173](http://localhost:5173) را در مرورگر خود باز کنید.

۴. **بیلد پروژه برای انتشار نهایی (Production):**
   ```bash
   npm run build
   ```
   خروجی فشرده و بهینه‌شده به صورت تک‌فایل در پوشه `dist/` ساخته می‌شود.

۵. **پیش‌نمایش بیلد نهایی:**
   ```bash
   npm run preview
   ```

---

## 📦 ساختار پوشه‌بندی پروژه

```text
persian-docker-learning-platform/
├── .github/
│   └── workflows/
│       └── deploy.yml        # پایپ‌لاین انتشار خودکار در GitHub Pages
├── public/                   # دارایی‌های استاتیک
├── src/
│   ├── components/
│   │   ├── BackupModal.tsx   # پنجره پشتیبان‌گیری و بازیابی پیشرفت (Export/Import)
│   │   ├── BackupModal.css
│   │   ├── Cheatsheet.tsx    # دفترچه دستورات داکر و فیلترها
│   │   ├── Cheatsheet.css
│   │   ├── DockerLab.tsx     # شبیه‌ساز پایانه و آزمایشگاه زنده
│   │   ├── DockerLab.css
│   │   ├── Footer.tsx        # فوتر تعاملی بندرگاه و وضعیت شبیه‌ساز
│   │   ├── Footer.css
│   │   ├── Home.tsx          # نقشه راه دوره و صفحه اصلی
│   │   ├── LessonPlayer.tsx  # موتور پخش مرحله‌به‌مرحله درس‌ها
│   │   └── StepBlocks.tsx    # بلوک‌های تعاملی کوییز، چالش و دیاگرام
│   ├── data/
│   │   ├── course.ts         # محتوای جامع ۱۶ درس و ۶ فصل دوره
│   │   ├── lab.ts            # سناریوهای آزمایشگاه، نقش‌ها و اعتبارسنجی اهداف
│   │   └── reference.ts      # مراجع سریع دستورات و نکات مهندسی
│   ├── lib/
│   │   └── dockerSim.ts      # موتور شبیه‌ساز درون مرورگر داکر و پردازشگر دستورات
│   ├── utils/
│   │   ├── backup.ts         # توابع اعتبارسنجی JSON و ساخت بک‌آپ
│   │   ├── clipboard.ts      # تابع کپی مطمئن در کلیپ‌بورد
│   │   └── cn.ts             # ادغام‌کننده کلاس‌های تیلویند
│   ├── App.tsx               # روت‌کامپوننت و مدیریت وضعیت پیشرفت
│   ├── index.css             # سیستم تم، پس‌زمینه کاغذ و متغیرهای عمومی
│   └── main.tsx              # نقطه ورود ری‌اکت
├── index.html                # صفحه اصلی HTML
├── package.json
├── tsconfig.json
└── vite.config.ts            # تنظیمات ساخت و ادغام تک‌فایلی Vite
```

---

## 🌐 انتشار زنده در GitHub Pages

این مخزن مجهز به اکشن خودکار گیت‌هاب (GitHub Actions) است که با هر کامیت به برنچ `main`، پروژه را بیلد کرده و در آدرس زیر منتشر می‌کند:

🔗 **آدرس وب‌سایت زنده: [https://0antuosh0-create.github.io/persian-docker-learning-platform/](https://0antuosh0-create.github.io/persian-docker-learning-platform/)**

---

## 🤝 مشارکت در توسعه (Contributing)

از هرگونه مشارکت، پیشنهاد سناریوهای جدید، گزارش باگ یا بهبود متن‌ها استقبال می‌کنیم:

۱. پروژه را Fork کنید.
۲. یک برنچ جدید بسازید (`git checkout -b feature/new-scenario`).
۳. تغییرات را کامیت کنید (`git commit -m 'feat: add compose healthcheck scenario'`).
۴. به برنچ خود Push کنید (`git push origin feature/new-scenario`).
۵. یک Pull Request باز کنید.

---

## 📄 مجوز (License)

این پروژه تحت لیسانس آزاد **MIT** منتشر شده است. برای اطلاعات بیشتر فایل [`LICENSE`](./LICENSE) را مطالعه فرمایید.

---

<div align="center">
  <sub>ساخته‌شده با ♥ برای توسعه‌دهندگان و مهندسان فارسی‌زبان</sub>
</div>
