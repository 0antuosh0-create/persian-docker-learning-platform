/* ══════════════════════════════════════════════════════════
   ماموریت‌های آزمایشگاه داکر
   هر ماموریت: داستان واقعی + اهداف قابل بررسی خودکار روی state
══════════════════════════════════════════════════════════ */
import type { LabState } from "../lib/dockerSim";
import { initialState, seedImage } from "../lib/dockerSim";

export type Objective = {
  id: string;
  label: string;
  check: (s: LabState) => boolean;
};

export type Mission = {
  id: string;
  order: number;
  title: string;
  level: 1 | 2 | 3;
  minutes: number;
  /** درس مرتبط برای اتصال به مسیر یادگیری */
  relatedLesson: string;
  /** موقعیت داستانی */
  brief: string[];
  /** نقش کاربر در سناریو */
  role: string;
  objectives: Objective[];
  hints: string[];
  success: string;
  /** وضعیت اولیه محیط */
  setup: () => LabState;
};

const running = (s: LabState, pred: (c: LabState["containers"][number]) => boolean) =>
  s.containers.some((c) => c.status === "running" && pred(c));

export const missions: Mission[] = [
  /* ─────────── ۱ ─────────── */
  {
    id: "m-first",
    order: 1,
    title: "اولین سرویس زنده",
    level: 1,
    minutes: 6,
    relatedLesson: "درس ۲ — چرخه عمر کانتینر",
    role: "توسعه‌دهنده تازه‌وارد تیم",
    brief: [
      "به تیم جدید ملحق شده‌اید و اولین کار شما راه‌اندازی یک وب‌سرور آزمایشی است.",
      "سرور باید **در پس‌زمینه** اجرا شود، نام مشخص `web` داشته باشد و از مرورگر روی پورت **۸۰۸۰** در دسترس باشد.",
      "راهنما: nginx داخل کانتینر به پورت ۸۰ گوش می‌دهد.",
    ],
    objectives: [
      {
        id: "o1",
        label: "کانتینری با نام web در حال اجراست",
        check: (s) => running(s, (c) => c.name === "web"),
      },
      {
        id: "o2",
        label: "از ایمیج nginx ساخته شده است",
        check: (s) => running(s, (c) => c.name === "web" && c.image.startsWith("nginx")),
      },
      {
        id: "o3",
        label: "پورت ۸۰۸۰ میزبان به پورت ۸۰ کانتینر وصل است",
        check: (s) => running(s, (c) => c.name === "web" && c.ports.includes("8080->80")),
      },
      {
        id: "o4",
        label: "وضعیت را با docker ps بررسی کرده‌اید",
        check: (s) => s.history.some((h) => /^docker\s+(ps|container\s+ls)/.test(h.trim())),
      },
    ],
    hints: [
      "ساختار کلی: docker run -d --name <نام> -p <میزبان>:<کانتینر> <ایمیج>",
      "فرمت پورت همیشه host:container است — یعنی 8080:80 نه 80:8080.",
      "پاسخ: docker run -d --name web -p 8080:80 nginx",
    ],
    success:
      "اولین سرویس شما زنده است! همان الگوی «‎-d برای پس‌زمینه، ‎--name برای شناسایی، ‎-p برای دسترسی» را روزی هزاران بار در کار واقعی خواهید نوشت.",
    setup: () => initialState(),
  },

  /* ─────────── ۲ ─────────── */
  {
    id: "m-debug",
    order: 2,
    title: "کانتینری که بالا نمی‌آید",
    level: 2,
    minutes: 10,
    relatedLesson: "درس ۲ و ۱۰ — لاگ‌ها و متغیرهای محیطی",
    role: "مهندس on-call",
    brief: [
      "ساعت ۲ بامداد است. سرویس `shop-api` روی سرور استیجینگ بالا نمی‌آید و تیم منتظر شماست.",
      "همکارتان دستور را اجرا کرده اما کانتینر بلافاصله می‌میرد. **اول علت را پیدا کنید، بعد درستش کنید.**",
      "سرویس برای اتصال به دیتابیس به متغیر محیطی `DB_HOST` نیاز دارد.",
    ],
    objectives: [
      {
        id: "o1",
        label: "کانتینر خراب را با docker ps -a پیدا کرده‌اید",
        check: (s) => s.history.some((h) => /docker\s+ps\s+.*-a/.test(h)),
      },
      {
        id: "o2",
        label: "با docker logs علت خروج را دیده‌اید",
        check: (s) => s.history.some((h) => /^docker\s+logs\s+\S+/.test(h.trim())),
      },
      {
        id: "o3",
        label: "کانتینر معیوب را حذف کرده‌اید",
        check: (s) => !s.containers.some((c) => c.name === "api" && c.status === "exited"),
      },
      {
        id: "o4",
        label: "سرویس api با DB_HOST درست در حال اجراست",
        check: (s) => running(s, (c) => c.name === "api" && !!c.env.DB_HOST),
      },
    ],
    hints: [
      "کانتینرهای متوقف‌شده در docker ps معمولی دیده نمی‌شوند — از docker ps -a استفاده کنید.",
      "لاگ کانتینر مرده هنوز در دسترس است: docker logs api",
      "برای حذف و ساخت دوباره: docker rm api سپس docker run -d --name api -e DB_HOST=db shop-api:1.0",
    ],
    success:
      "این دقیقاً چرخه واقعی عیب‌یابی است: ps -a برای دیدن جسد، logs برای کالبدشکافی، و اجرای دوباره با پیکربندی درست. حالا می‌دانید چرا «کانتینر کار نمی‌کند» هیچ‌وقت یک معمای حل‌نشدنی نیست.",
    setup: () => {
      const s = initialState();
      seedImage(s, "shop-api:1.0");
      /* همکار قبلاً بدون DB_HOST اجرا کرده — کانتینر مرده */
      s.containers.push({
        id: "b3f1a9c27d84",
        name: "api",
        image: "shop-api:1.0",
        status: "exited",
        exitCode: 1,
        ports: "",
        network: "bridge",
        volumes: [],
        env: {},
        command: "node server.js",
        createdAt: Date.now() - 1000 * 60 * 4,
        logs: [
          { text: "[shop-api] booting…" },
          { text: "Error: environment variable DB_HOST is not defined", tone: "err" },
          { text: "    at loadConfig (/app/config.js:14:11)", tone: "err" },
          { text: "    at Object.<anonymous> (/app/server.js:3:16)", tone: "err" },
          { text: "[shop-api] exiting with code 1", tone: "err" },
        ],
      });
      return s;
    },
  },

  /* ─────────── ۳ ─────────── */
  {
    id: "m-volume",
    order: 3,
    title: "نجات داده‌ها",
    level: 2,
    minutes: 10,
    relatedLesson: "درس ۶ — پایداری داده با Volume",
    role: "مهندس پایگاه داده",
    brief: [
      "می‌خواهیم یک PostgreSQL راه بیندازیم که **با حذف کانتینر، داده‌هایش از بین نرود**.",
      "والیومی به نام `pg_data` بسازید و آن را به مسیر داده Postgres یعنی `/var/lib/postgresql/data` وصل کنید.",
      "سپس ثابت کنید کار می‌کند: کانتینر را کامل نابود کنید و دوباره با همان والیوم بالا بیاورید.",
    ],
    objectives: [
      {
        id: "o1",
        label: "والیوم نام‌دار pg_data ساخته شده است",
        check: (s) => s.volumes.some((v) => v.name === "pg_data" && v.createdBy === "user"),
      },
      {
        id: "o2",
        label: "کانتینر postgres با والیوم pg_data اجرا شده است",
        check: (s) =>
          s.containers.some((c) =>
            c.image.startsWith("postgres") && c.volumes.some((m) => m.startsWith("pg_data:/var/lib/postgresql/data"))
          ),
      },
      {
        id: "o3",
        label: "کانتینر اول را حذف کرده‌اید (آزمون نابودی)",
        check: (s) => s.history.some((h) => /^docker\s+rm\b/.test(h.trim())),
      },
      {
        id: "o4",
        label: "کانتینر تازه‌ای با همان والیوم در حال اجراست",
        check: (s) =>
          running(s, (c) => c.image.startsWith("postgres") && c.volumes.some((m) => m.startsWith("pg_data:"))) &&
          s.volumes.some((v) => v.name === "pg_data"),
      },
    ],
    hints: [
      "اول والیوم: docker volume create pg_data",
      "سپس اجرا: docker run -d --name db -v pg_data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret postgres:17-alpine",
      "برای آزمون: docker rm -f db و بعد دوباره همان دستور run با نام جدید.",
    ],
    success:
      "کانتینر نابود شد اما والیوم زنده ماند — و کانتینر جدید بلافاصله همان داده‌ها را دید. این تفاوت بین «داده‌ای که می‌ماند» و «داده‌ای که با یک docker rm دود می‌شود» است.",
    setup: () => {
      const s = initialState();
      seedImage(s, "postgres:17-alpine");
      return s;
    },
  },

  /* ─────────── ۴ ─────────── */
  {
    id: "m-network",
    order: 4,
    title: "دو سرویس که همدیگر را پیدا نمی‌کنند",
    level: 3,
    minutes: 12,
    relatedLesson: "درس ۷ — شبکه اختصاصی و DNS داخلی",
    role: "معمار Backend",
    brief: [
      "سرویس `api` و دیتابیس `cache` روی شبکه پیش‌فرض اجرا شده‌اند و api نمی‌تواند با نام به cache برسد.",
      "یک شبکه اختصاصی به نام `app-net` بسازید و **هر دو سرویس** را روی آن اجرا کنید.",
      "در پایان با `docker exec api ping cache` ثابت کنید DNS داخلی کار می‌کند.",
    ],
    objectives: [
      {
        id: "o1",
        label: "شبکه اختصاصی app-net ساخته شده است",
        check: (s) => s.networks.some((n) => n.name === "app-net" && !n.builtin),
      },
      {
        id: "o2",
        label: "سرویس cache روی app-net در حال اجراست",
        check: (s) => running(s, (c) => c.name === "cache" && c.network === "app-net"),
      },
      {
        id: "o3",
        label: "سرویس api روی همان شبکه در حال اجراست",
        check: (s) => running(s, (c) => c.name === "api" && c.network === "app-net"),
      },
      {
        id: "o4",
        label: "ارتباط با نام را با ping تأیید کرده‌اید",
        check: (s) => s.history.some((h) => /docker\s+exec\s+\S*api\S*\s+ping\s+cache/.test(h)),
      },
    ],
    hints: [
      "کانتینرهای قدیمی روی bridge هستند؛ اول با docker rm -f api cache حذفشان کنید.",
      "شبکه: docker network create app-net",
      "اجرا: docker run -d --name cache --network app-net redis:alpine و سپس همان الگو برای api با ‎-e DB_HOST=cache",
      "آزمون نهایی: docker exec api ping cache",
    ],
    success:
      "حالا DNS داخلی داکر نام `cache` را به IP ترجمه می‌کند — بدون IP هاردکد و بدون publish کردن پورت دیتابیس. همین مفهوم، پایه شبکه در Compose و Kubernetes است.",
    setup: () => {
      const s = initialState();
      seedImage(s, "redis:alpine");
      seedImage(s, "shop-api:1.0");
      s.containers.push({
        id: "9a1c4e77b230",
        name: "cache",
        image: "redis:alpine",
        status: "running",
        exitCode: 0,
        ports: "",
        network: "bridge",
        volumes: ["c7f2a9e14b05:/data"],
        env: {},
        command: "redis-server",
        createdAt: Date.now() - 1000 * 60 * 9,
        logs: [{ text: "Ready to accept connections tcp" }],
      });
      s.volumes.push({ name: "c7f2a9e14b05", createdBy: "anonymous" });
      s.containers.push({
        id: "4d8b0f36ac91",
        name: "api",
        image: "shop-api:1.0",
        status: "running",
        exitCode: 0,
        ports: "0.0.0.0:3000->3000/tcp",
        network: "bridge",
        volumes: [],
        env: { DB_HOST: "cache" },
        command: "node server.js",
        createdAt: Date.now() - 1000 * 60 * 8,
        logs: [
          { text: "[shop-api] booting…" },
          { text: "[shop-api] connected to database at cache:5432" },
          { text: "[shop-api] listening on :3000" },
        ],
      });
      return s;
    },
  },

  /* ─────────── ۶ (در انتهای فهرست) ─────────── */
  {
    id: "m-limits",
    order: 6,
    title: "سرویس ضد-سقوط",
    level: 3,
    minutes: 9,
    relatedLesson: "درس ۱۴ — محدودسازی منابع",
    role: "مهندس زیرساخت",
    brief: [
      "سرور شما ۴ گیگابایت رم دارد و روی آن دیتابیس و چند سرویس دیگر هم اجرا می‌شود.",
      "سرویس `analytics` سابقه نشت حافظه دارد. باید آن را طوری اجرا کنید که **اگر دچار نشت شد، تنها خودش قربانی شود** نه بقیه سرور.",
      "سقف رم ۵۱۲ مگابایت، سقف CPU یک‌ونیم هسته، و اجرای مجدد خودکار پس از خطا.",
    ],
    objectives: [
      {
        id: "o1",
        label: "کانتینر analytics در حال اجراست",
        check: (s) => running(s, (c) => c.name === "analytics"),
      },
      {
        id: "o2",
        label: "سقف حافظه 512m تعریف شده است",
        check: (s) => running(s, (c) => c.name === "analytics" && c.limits?.memory === "512m"),
      },
      {
        id: "o3",
        label: "سقف CPU برابر 1.5 هسته است",
        check: (s) => running(s, (c) => c.name === "analytics" && c.limits?.cpus === "1.5"),
      },
      {
        id: "o4",
        label: "سیاست ری‌استارت on-failure تنظیم شده است",
        check: (s) => running(s, (c) => c.name === "analytics" && c.restart === "on-failure"),
      },
    ],
    hints: [
      "سقف رم با ‎--memory=512m و سقف CPU با ‎--cpus=1.5 داده می‌شود.",
      "سیاست ری‌استارت با ‎--restart on-failure تنظیم می‌شود.",
      "پاسخ: docker run -d --name analytics --memory=512m --cpus=1.5 --restart on-failure analytics:2.0",
    ],
    success:
      "حالا اگر این سرویس دچار نشت حافظه شود، هسته لینوکس تنها همین کانتینر را می‌کشد و ‎--restart on-failure آن را برمی‌گرداند. دیتابیس و بقیه سرویس‌ها دست‌نخورده می‌مانند — این مرز باریک، تفاوت بین یک حادثه کوچک و یک خاموشی کامل است.",
    setup: () => {
      const s = initialState();
      s.images.push({ repo: "analytics", tag: "2.0", id: "7c1e9b4a2f83", size: "212MB" });
      seedImage(s, "postgres:17-alpine");
      s.containers.push({
        id: "5d9a2f8c1e70",
        name: "db",
        image: "postgres:17-alpine",
        status: "running",
        exitCode: 0,
        ports: "",
        network: "bridge",
        volumes: ["8b4c1f9e2a73:/var/lib/postgresql/data"],
        env: { POSTGRES_PASSWORD: "prod-secret" },
        command: "postgres",
        createdAt: Date.now() - 1000 * 60 * 240,
        logs: [{ text: "database system is ready to accept connections" }],
      });
      s.volumes.push({ name: "8b4c1f9e2a73", createdBy: "user" });
      return s;
    },
  },

  /* ─────────── ۵ ─────────── */
  {
    id: "m-cleanup",
    order: 5,
    title: "پاکسازی سرور شلوغ",
    level: 3,
    minutes: 10,
    relatedLesson: "درس ۶ — والیوم بی‌نام و مدیریت منابع",
    role: "مهندس زیرساخت",
    brief: [
      "سرور استیجینگ پر از آشغال شده: کانتینرهای مرده، ایمیج بلااستفاده و **والیوم‌های بی‌نام** که فضا اشغال کرده‌اند.",
      "محیط را تمیز کنید: همه کانتینرهای متوقف‌شده حذف شوند و والیوم‌های بی‌استفاده پاک شوند.",
      "مراقب باشید: سرویس `web` باید **دست‌نخورده و در حال اجرا** باقی بماند.",
    ],
    objectives: [
      {
        id: "o1",
        label: "وضعیت کامل را با docker ps -a بررسی کرده‌اید",
        check: (s) => s.history.some((h) => /docker\s+ps\s+.*-a/.test(h)),
      },
      {
        id: "o2",
        label: "هیچ کانتینر متوقف‌شده‌ای باقی نمانده است",
        check: (s) => !s.containers.some((c) => c.status === "exited"),
      },
      {
        id: "o3",
        label: "والیوم‌های بی‌نام (بی‌استفاده) پاک شده‌اند",
        check: (s) => {
          const used = new Set(s.containers.flatMap((c) => c.volumes.map((m) => m.split(":")[0])));
          return !s.volumes.some((v) => v.createdBy === "anonymous" && !used.has(v.name));
        },
      },
      {
        id: "o4",
        label: "سرویس web هنوز سالم و در حال اجراست",
        check: (s) => running(s, (c) => c.name === "web"),
      },
    ],
    hints: [
      "اول ببینید چه چیزی هست: docker ps -a و docker volume ls",
      "کانتینرهای مرده را تک‌به‌تک حذف کنید: docker rm <name>",
      "والیوم‌های بی‌استفاده: docker volume prune — والیوم متصل به کانتینر زنده حذف نمی‌شود.",
      "مراقب باشید docker rm -f web نزنید! فقط متوقف‌شده‌ها را پاک کنید.",
    ],
    success:
      "سرور تمیز شد بدون اینکه سرویس زنده آسیب ببیند. توجه کنید که والیوم‌های بی‌نام چطور بی‌سروصدا انباشته می‌شوند — همان دامی که در درس والیوم دیدید، اینجا در مقیاس واقعی.",
    setup: () => {
      const s = initialState();
      seedImage(s, "nginx:alpine");
      seedImage(s, "redis:alpine");
      seedImage(s, "hello-world");
      s.containers.push({
        id: "1f2e3d4c5b6a",
        name: "web",
        image: "nginx:alpine",
        status: "running",
        exitCode: 0,
        ports: "0.0.0.0:80->80/tcp",
        network: "bridge",
        volumes: [],
        env: {},
        command: "nginx -g 'daemon off;'",
        createdAt: Date.now() - 1000 * 60 * 120,
        logs: [{ text: "nginx/1.27.3 (alpine) started, listening on 0.0.0.0:80" }],
      });
      const dead = [
        { name: "test-run", image: "hello-world:latest", code: 0 },
        { name: "old-cache", image: "redis:alpine", code: 0 },
        { name: "migration-job", image: "hello-world:latest", code: 1 },
      ];
      dead.forEach((d, i) => {
        s.containers.push({
          id: `dead${i}0a1b2c3d`,
          name: d.name,
          image: d.image,
          status: "exited",
          exitCode: d.code,
          ports: "",
          network: "bridge",
          volumes: [],
          env: {},
          command: "/bin/sh",
          createdAt: Date.now() - 1000 * 60 * (30 + i * 20),
          logs: [{ text: d.code ? "task failed" : "task completed" , tone: d.code ? "err" : undefined }],
        });
      });
      s.volumes.push({ name: "a1b2c3d4e5f60718", createdBy: "anonymous" });
      s.volumes.push({ name: "f9e8d7c6b5a41320", createdBy: "anonymous" });
      return s;
    },
  },
];
