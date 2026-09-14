/* ══════════════════════════════════════════════════════════
   موتور شبیه‌ساز Docker — یک Docker Engine کوچک در مرورگر
   وضعیت واقعی نگه می‌دارد: ایمیج، کانتینر، والیوم، شبکه
══════════════════════════════════════════════════════════ */

export type OutLine = { text: string; tone?: "err" | "ok" | "dim" | "warn" };

export type SimImage = { repo: string; tag: string; id: string; size: string };

export type SimContainer = {
  id: string;
  name: string;
  image: string;
  status: "running" | "exited";
  exitCode: number;
  ports: string;
  network: string;
  volumes: string[];
  env: Record<string, string>;
  command: string;
  createdAt: number;
  logs: OutLine[];
  /** سقف منابع تعریف‌شده با ‎--memory و ‎--cpus */
  limits?: { memory?: string; cpus?: string };
  restart?: string;
};

export type SimVolume = { name: string; createdBy: "user" | "anonymous" };
export type SimNetwork = { name: string; driver: string; builtin?: boolean };

export type LabState = {
  images: SimImage[];
  containers: SimContainer[];
  volumes: SimVolume[];
  networks: SimNetwork[];
  history: string[];
  seq: number;
};

/* ── کاتالوگ ایمیج‌های قابل دریافت از «رجیستری» ── */
type ImageSpec = {
  size: string;
  /** سرویس دائمی است یا دستور کوتاه؟ */
  longRunning: boolean;
  /** متغیرهای محیطی الزامی؛ نبودشان باعث کرش می‌شود */
  requiredEnv?: string[];
  defaultCommand: string;
  /** مسیر داده‌ای که ایمیج روی آن VOLUME تعریف کرده */
  dataPath?: string;
  logsOk: string[];
  logsMissingEnv?: string[];
  oneShotOutput?: string[];
};

const CATALOG: Record<string, ImageSpec> = {
  nginx: {
    size: "192MB",
    longRunning: true,
    defaultCommand: "nginx -g 'daemon off;'",
    logsOk: [
      "/docker-entrypoint.sh: Configuration complete; ready for start up",
      "nginx/1.27.3 started, listening on 0.0.0.0:80",
    ],
  },
  "nginx:alpine": {
    size: "48.2MB",
    longRunning: true,
    defaultCommand: "nginx -g 'daemon off;'",
    logsOk: ["nginx/1.27.3 (alpine) started, listening on 0.0.0.0:80"],
  },
  "postgres:17-alpine": {
    size: "274MB",
    longRunning: true,
    requiredEnv: ["POSTGRES_PASSWORD"],
    dataPath: "/var/lib/postgresql/data",
    defaultCommand: "postgres",
    logsOk: [
      "The files belonging to this database system will be owned by \"postgres\".",
      "database system is ready to accept connections",
    ],
    logsMissingEnv: [
      "Error: Database is uninitialized and superuser password is not specified.",
      "       You must specify POSTGRES_PASSWORD to a non-empty value.",
    ],
  },
  "redis:alpine": {
    size: "41.4MB",
    longRunning: true,
    dataPath: "/data",
    defaultCommand: "redis-server",
    logsOk: ["Ready to accept connections tcp"],
  },
  "node:22-alpine": {
    size: "156MB",
    longRunning: false,
    defaultCommand: "node",
    logsOk: [],
    oneShotOutput: ["Welcome to Node.js v22.11.0."],
  },
  alpine: {
    size: "7.8MB",
    longRunning: false,
    defaultCommand: "/bin/sh",
    logsOk: [],
  },
  "hello-world": {
    size: "13.3kB",
    longRunning: false,
    defaultCommand: "/hello",
    logsOk: [],
    oneShotOutput: [
      "",
      "Hello from Docker!",
      "This message shows that your installation appears to be working correctly.",
      "",
    ],
  },
  /* ایمیج داخلی تیم — برای سناریوی عیب‌یابی */
  "shop-api:1.0": {
    size: "148MB",
    longRunning: true,
    requiredEnv: ["DB_HOST"],
    defaultCommand: "node server.js",
    logsOk: [
      "[shop-api] booting…",
      "[shop-api] connected to database at $DB_HOST:5432",
      "[shop-api] listening on :3000",
    ],
    logsMissingEnv: [
      "[shop-api] booting…",
      "Error: environment variable DB_HOST is not defined",
      "    at loadConfig (/app/config.js:14:11)",
      "    at Object.<anonymous> (/app/server.js:3:16)",
      "[shop-api] exiting with code 1",
    ],
  },
};

export const REGISTRY_IMAGES = Object.keys(CATALOG);

/* ── ابزارهای کمکی ── */
const hex = "0123456789abcdef";
function makeId(seed: number) {
  let s = seed * 2654435761;
  let out = "";
  for (let i = 0; i < 12; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out += hex[s % 16];
  }
  return out;
}

const ADJ = ["quirky", "eager", "brave", "clever", "jolly", "silly", "vivid", "zen"];
const SCI = ["einstein", "curie", "turing", "hopper", "tesla", "lovelace", "bohr", "newton"];
function autoName(seq: number) {
  return `${ADJ[seq % ADJ.length]}_${SCI[(seq * 3) % SCI.length]}`;
}

function normalizeImage(ref: string) {
  return ref.includes(":") ? ref : `${ref}:latest`;
}
function splitRef(ref: string) {
  const full = normalizeImage(ref);
  const idx = full.lastIndexOf(":");
  return { repo: full.slice(0, idx), tag: full.slice(idx + 1) };
}
/** کاتالوگ را با/بدون تگ latest پیدا می‌کند */
function lookupSpec(ref: string): ImageSpec | undefined {
  if (CATALOG[ref]) return CATALOG[ref];
  const bare = ref.replace(/:latest$/, "");
  return CATALOG[bare];
}

function findContainer(state: LabState, ref: string) {
  return state.containers.find((c) => c.name === ref || c.id.startsWith(ref));
}

function ago(ms: number) {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.round(s / 60);
  return `${m} minute${m === 1 ? "" : "s"}`;
}

function pad(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

/* ── توکنایز با احترام به کوتیشن ── */
export function tokenize(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of input.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function initialState(): LabState {
  return {
    images: [],
    containers: [],
    volumes: [],
    networks: [
      { name: "bridge", driver: "bridge", builtin: true },
      { name: "host", driver: "host", builtin: true },
      { name: "none", driver: "null", builtin: true },
    ],
    history: [],
    seq: 1,
  };
}

/** ایمیج را در استیت موجود می‌کند (شبیه pull) */
export function seedImage(state: LabState, ref: string) {
  const spec = lookupSpec(ref);
  if (!spec) return;
  const { repo, tag } = splitRef(ref);
  if (state.images.some((i) => i.repo === repo && i.tag === tag)) return;
  state.images.push({ repo, tag, id: makeId(state.seq++), size: spec.size });
}

/** کپی عمیق ایمن — بدون وابستگی به structuredClone در مرورگرهای قدیمی */
function cloneState(s: LabState): LabState {
  if (typeof structuredClone === "function") {
    try { return structuredClone(s); } catch { /* fallthrough */ }
  }
  return JSON.parse(JSON.stringify(s)) as LabState;
}

/* ══════════════ اجرای دستور ══════════════ */
export function runCommand(prev: LabState, input: string): { out: OutLine[]; state: LabState } {
  const state: LabState = cloneState(prev);
  const raw = input.trim();
  if (!raw) return { out: [], state };
  state.history.push(raw);

  const t = tokenize(raw);
  const out: OutLine[] = [];
  const err = (m: string) => out.push({ text: m, tone: "err" });

  if (t[0] === "clear") return { out: [{ text: "__CLEAR__" }], state };
  if (t[0] === "help") return { out: helpText(), state };

  if (t[0] !== "docker") {
    err(`${t[0]}: command not found`);
    out.push({ text: "Only 'docker' commands are supported in this lab. Type 'help' for available commands.", tone: "dim" });
    return { out, state };
  }

  const sub = t[1];
  const args = t.slice(2);

  switch (sub) {
    case "run":
      return { out: cmdRun(state, args), state };
    case "ps":
      return { out: cmdPs(state, args), state };
    case "images":
      return { out: cmdImages(state), state };
    case "pull":
      return { out: cmdPull(state, args), state };
    case "logs":
      return { out: cmdLogs(state, args), state };
    case "stop":
      return { out: cmdStop(state, args), state };
    case "start":
      return { out: cmdStart(state, args), state };
    case "restart": {
      const a = cmdStop(state, args);
      const b = cmdStart(state, args);
      return { out: [...a.filter((l) => l.tone === "err"), ...b], state };
    }
    case "rm":
      return { out: cmdRm(state, args), state };
    case "rmi":
      return { out: cmdRmi(state, args), state };
    case "exec":
      return { out: cmdExec(state, args), state };
    case "inspect":
      return { out: cmdInspect(state, args), state };
    case "volume":
      return { out: cmdVolume(state, args), state };
    case "network":
      return { out: cmdNetwork(state, args), state };
    case "image":
      if (args[0] === "ls") return { out: cmdImages(state), state };
      if (args[0] === "rm") return { out: cmdRmi(state, args.slice(1)), state };
      err(`docker image: '${args[0] ?? ""}' is not supported.`);
      return { out, state };
    case "container":
      if (args[0] === "ls") return { out: cmdPs(state, args.slice(1)), state };
      err(`docker container: '${args[0] ?? ""}' is not supported.`);
      return { out, state };
    default:
      err(`docker: '${sub ?? ""}' is not a recognized command in this lab.`);
      out.push({ text: "Type 'help' to see available commands.", tone: "dim" });
      return { out, state };
  }
}

/* ── docker run ── */
function cmdRun(state: LabState, args: string[]): OutLine[] {
  const out: OutLine[] = [];
  let detach = false;
  let rm = false;
  let name = "";
  let network = "bridge";
  let ports = "";
  const volumes: string[] = [];
  const env: Record<string, string> = {};
  let imageRef = "";
  const cmdParts: string[] = [];
  const limits: SimContainer["limits"] = {};
  let restart = "";

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (imageRef) { cmdParts.push(a); continue; }
    if (a.startsWith("--memory=") || a.startsWith("-m=")) limits.memory = a.split("=")[1];
    else if (a === "--memory" || a === "-m") limits.memory = args[++i] ?? "";
    else if (a.startsWith("--cpus=")) limits.cpus = a.split("=")[1];
    else if (a === "--cpus") limits.cpus = args[++i] ?? "";
    else if (a.startsWith("--restart=")) restart = a.slice(10);
    else if (a === "--restart") restart = args[++i] ?? "";
    if (a === "-d" || a === "--detach") detach = true;
    else if (a === "--rm") rm = true;
    else if (a === "-it" || a === "-i" || a === "-t" || a === "-ti") { /* تعاملی */ }
    else if (a === "--name") name = args[++i] ?? "";
    else if (a.startsWith("--name=")) name = a.slice(7);
    else if (a === "-p" || a === "--publish") ports = args[++i] ?? "";
    else if (a.startsWith("-p")) ports = a.slice(2);
    else if (a === "--network") network = args[++i] ?? "bridge";
    else if (a.startsWith("--network=")) network = a.slice(10);
    else if (a === "-v" || a === "--volume") volumes.push(args[++i] ?? "");
    else if (a.startsWith("-v")) volumes.push(a.slice(2));
    else if (a === "-e" || a === "--env") {
      const kv = args[++i] ?? "";
      const eq = kv.indexOf("=");
      if (eq > 0) env[kv.slice(0, eq)] = kv.slice(eq + 1);
    } else if (a.startsWith("-e")) {
      const kv = a.slice(2);
      const eq = kv.indexOf("=");
      if (eq > 0) env[kv.slice(0, eq)] = kv.slice(eq + 1);
    } else if (a.startsWith("-")) { /* فلگ ناشناخته: نادیده */ }
    else imageRef = a;
  }

  if (!imageRef) {
    out.push({ text: `docker: "docker run" requires at least 1 argument.`, tone: "err" });
    return out;
  }

  const spec = lookupSpec(imageRef);
  if (!spec) {
    out.push({ text: `Unable to find image '${normalizeImage(imageRef)}' locally`, tone: "dim" });
    out.push({ text: `docker: Error response from daemon: pull access denied for ${imageRef}.`, tone: "err" });
    out.push({ text: "ایمیج‌های موجود این آزمایشگاه را با «help» ببینید.", tone: "dim" });
    return out;
  }

  const { repo, tag } = splitRef(imageRef);
  if (!state.images.some((i) => i.repo === repo && i.tag === tag)) {
    out.push({ text: `Unable to find image '${repo}:${tag}' locally`, tone: "dim" });
    out.push({ text: `${tag}: Pulling from library/${repo}` });
    out.push({ text: `${makeId(state.seq).slice(0, 12)}: Pull complete` });
    out.push({ text: `Status: Downloaded newer image for ${repo}:${tag}` });
    state.images.push({ repo, tag, id: makeId(state.seq++), size: spec.size });
  }

  if (name && state.containers.some((c) => c.name === name)) {
    out.push({
      text: `docker: Error response from daemon: Conflict. The container name "/${name}" is already in use.`,
      tone: "err",
    });
    out.push({ text: `Duplicate name — remove it first with 'docker rm ${name}'.`, tone: "dim" });
    return out;
  }

  if (network !== "bridge" && !state.networks.some((n) => n.name === network)) {
    out.push({ text: `docker: Error response from daemon: network ${network} not found.`, tone: "err" });
    return out;
  }

  /* والیوم‌ها: نام‌دار ساخته می‌شود، بی‌نام هم ثبت می‌شود */
  const mounted: string[] = [];
  for (const v of volumes) {
    if (!v.includes(":")) continue;
    const [src, dst] = v.split(":");
    mounted.push(`${src}:${dst}`);
    if (!src.startsWith(".") && !src.startsWith("/") && !state.volumes.some((x) => x.name === src)) {
      state.volumes.push({ name: src, createdBy: "user" });
    }
  }
  /* اگر ایمیج VOLUME دارد و کاربر چیزی mount نکرده → والیوم بی‌نام */
  if (spec.dataPath && !mounted.some((m) => m.endsWith(spec.dataPath!))) {
    const anon = makeId(state.seq++) + makeId(state.seq);
    state.volumes.push({ name: anon, createdBy: "anonymous" });
    mounted.push(`${anon}:${spec.dataPath}`);
  }

  const missing = (spec.requiredEnv ?? []).filter((k) => !(k in env));
  const id = makeId(state.seq++);
  const cname = name || autoName(state.seq);
  const command = cmdParts.length ? cmdParts.join(" ") : spec.defaultCommand;

  const logs: OutLine[] = [];
  let status: SimContainer["status"] = "running";
  let exitCode = 0;

  if (missing.length) {
    (spec.logsMissingEnv ?? [`Error: missing required environment variable ${missing[0]}`]).forEach((l) =>
      logs.push({ text: l, tone: "err" })
    );
    status = "exited";
    exitCode = 1;
  } else if (spec.longRunning) {
    spec.logsOk.forEach((l) => {
      let text = l;
      for (const [k, v] of Object.entries(env)) text = text.replace(`$${k}`, v);
      logs.push({ text });
    });
  } else {
    (spec.oneShotOutput ?? []).forEach((l) => logs.push({ text: l }));
    status = "exited";
    exitCode = 0;
  }

  const container: SimContainer = {
    id, name: cname, image: `${repo}:${tag}`, status, exitCode,
    ports: ports ? `0.0.0.0:${ports.split(":")[0]}->${ports.split(":")[1]}/tcp` : "",
    network, volumes: mounted, env, command,
    createdAt: Date.now(), logs, limits,
    restart: restart || undefined,
  };

  const keep = !(rm && status === "exited");
  if (keep) state.containers.push(container);

  if (detach) {
    out.push({ text: id });
    if (status === "exited") {
      out.push({ text: `⚠ کانتینر بلافاصله خارج شد (exit ${exitCode}).`, tone: "warn" });
      out.push({ text: `علت را ببینید: docker logs ${cname}`, tone: "dim" });
    }
  } else {
    logs.forEach((l) => out.push(l));
    if (spec.longRunning && status === "running") {
      out.push({ text: "^C  (Use -d flag to run in background)", tone: "dim" });
    }
  }
  return out;
}

/* ── docker ps ── */
function cmdPs(state: LabState, args: string[]): OutLine[] {
  const all = args.includes("-a") || args.includes("--all");
  const rows = state.containers.filter((c) => all || c.status === "running");
  const out: OutLine[] = [
    {
      text: `${pad("CONTAINER ID", 15)}${pad("IMAGE", 22)}${pad("STATUS", 24)}${pad("PORTS", 24)}NAMES`,
      tone: "dim",
    },
  ];
  if (!rows.length) {
    out.push({
      text: all ? "No containers found." : "No running containers. Use -a to include stopped containers.",
      tone: "dim",
    });
    return out;
  }
  rows.forEach((c) => {
    const status = c.status === "running" ? `Up ${ago(c.createdAt)}` : `Exited (${c.exitCode}) ${ago(c.createdAt)} ago`;
    out.push({
      text: `${pad(c.id.slice(0, 12), 15)}${pad(c.image, 22)}${pad(status, 24)}${pad(c.ports || "", 24)}${c.name}`,
      tone: c.status === "running" ? "ok" : undefined,
    });
  });
  return out;
}

/* ── docker images ── */
function cmdImages(state: LabState): OutLine[] {
  const out: OutLine[] = [
    { text: `${pad("REPOSITORY", 24)}${pad("TAG", 14)}${pad("IMAGE ID", 15)}SIZE`, tone: "dim" },
  ];
  if (!state.images.length) {
    out.push({ text: "No local images found. Run 'docker pull <image>' to download one.", tone: "dim" });
    return out;
  }
  state.images.forEach((i) =>
    out.push({ text: `${pad(i.repo, 24)}${pad(i.tag, 14)}${pad(i.id.slice(0, 12), 15)}${i.size}` })
  );
  return out;
}

/* ── docker pull ── */
function cmdPull(state: LabState, args: string[]): OutLine[] {
  const ref = args.find((a) => !a.startsWith("-"));
  const out: OutLine[] = [];
  if (!ref) return [{ text: `"docker pull" requires exactly 1 argument.`, tone: "err" }];
  const spec = lookupSpec(ref);
  if (!spec) {
    out.push({ text: `Error response from daemon: pull access denied for ${ref}`, tone: "err" });
    return out;
  }
  const { repo, tag } = splitRef(ref);
  if (state.images.some((i) => i.repo === repo && i.tag === tag)) {
    out.push({ text: `${tag}: Pulling from library/${repo}` });
    out.push({ text: `Status: Image is up to date for ${repo}:${tag}`, tone: "ok" });
    return out;
  }
  out.push({ text: `${tag}: Pulling from library/${repo}` });
  out.push({ text: `${makeId(state.seq).slice(0, 12)}: Pull complete` });
  out.push({ text: `${makeId(state.seq + 7).slice(0, 12)}: Pull complete` });
  out.push({ text: `Status: Downloaded newer image for ${repo}:${tag}`, tone: "ok" });
  state.images.push({ repo, tag, id: makeId(state.seq++), size: spec.size });
  return out;
}

/* ── docker logs ── */
function cmdLogs(state: LabState, args: string[]): OutLine[] {
  const ref = args.find((a) => !a.startsWith("-"));
  if (!ref) return [{ text: `"docker logs" requires exactly 1 argument.`, tone: "err" }];
  const c = findContainer(state, ref);
  if (!c) return [{ text: `Error: No such container: ${ref}`, tone: "err" }];
  if (!c.logs.length) return [{ text: "(بدون خروجی)", tone: "dim" }];
  return c.logs.map((l) => ({ ...l }));
}

/* ── stop / start ── */
function cmdStop(state: LabState, args: string[]): OutLine[] {
  const refs = args.filter((a) => !a.startsWith("-"));
  if (!refs.length) return [{ text: `"docker stop" requires at least 1 argument.`, tone: "err" }];
  return refs.map((ref) => {
    const c = findContainer(state, ref);
    if (!c) return { text: `Error response from daemon: No such container: ${ref}`, tone: "err" as const };
    c.status = "exited";
    c.exitCode = 0;
    return { text: c.name };
  });
}

function cmdStart(state: LabState, args: string[]): OutLine[] {
  const refs = args.filter((a) => !a.startsWith("-"));
  if (!refs.length) return [{ text: `"docker start" requires at least 1 argument.`, tone: "err" }];
  return refs.map((ref) => {
    const c = findContainer(state, ref);
    if (!c) return { text: `Error response from daemon: No such container: ${ref}`, tone: "err" as const };
    const spec = lookupSpec(c.image);
    const missing = (spec?.requiredEnv ?? []).filter((k) => !(k in c.env));
    if (missing.length || !spec?.longRunning) {
      c.status = "exited";
      c.exitCode = missing.length ? 1 : 0;
    } else {
      c.status = "running";
      c.exitCode = 0;
      c.createdAt = Date.now();
    }
    return { text: c.name };
  });
}

/* ── docker rm / rmi ── */
function cmdRm(state: LabState, args: string[]): OutLine[] {
  const force = args.includes("-f") || args.includes("--force");
  const refs = args.filter((a) => !a.startsWith("-"));
  if (!refs.length) return [{ text: `"docker rm" requires at least 1 argument.`, tone: "err" }];
  return refs.map((ref) => {
    const c = findContainer(state, ref);
    if (!c) return { text: `Error response from daemon: No such container: ${ref}`, tone: "err" as const };
    if (c.status === "running" && !force) {
      return {
        text: `Error response from daemon: You cannot remove a running container ${c.id}. Stop it first or use -f`,
        tone: "err" as const,
      };
    }
    state.containers = state.containers.filter((x) => x.id !== c.id);
    return { text: c.name };
  });
}

function cmdRmi(state: LabState, args: string[]): OutLine[] {
  const refs = args.filter((a) => !a.startsWith("-"));
  if (!refs.length) return [{ text: `"docker rmi" requires at least 1 argument.`, tone: "err" }];
  return refs.map((ref) => {
    const { repo, tag } = splitRef(ref);
    const img = state.images.find((i) => i.repo === repo && i.tag === tag);
    if (!img) return { text: `Error response from daemon: No such image: ${ref}`, tone: "err" as const };
    const used = state.containers.find((c) => c.image === `${repo}:${tag}`);
    if (used) {
      return {
        text: `Error response from daemon: conflict: unable to remove repository reference "${ref}" (container ${used.id.slice(0, 12)} is using it)`,
        tone: "err" as const,
      };
    }
    state.images = state.images.filter((i) => i !== img);
    return { text: `Untagged: ${repo}:${tag}` };
  });
}

/* ── docker exec ── */
function cmdExec(state: LabState, args: string[]): OutLine[] {
  const rest = args.filter((a) => !a.startsWith("-"));
  const ref = rest[0];
  const cmd = rest.slice(1);
  if (!ref) return [{ text: `"docker exec" requires at least 2 arguments.`, tone: "err" }];
  const c = findContainer(state, ref);
  if (!c) return [{ text: `Error: No such container: ${ref}`, tone: "err" }];
  if (c.status !== "running") {
    return [
      { text: `Error response from daemon: Container ${c.id.slice(0, 12)} is not running`, tone: "err" },
      { text: "کانتینر باید در حال اجرا باشد. اول علت خروج را با docker logs ببینید.", tone: "dim" },
    ];
  }
  const head = cmd[0] ?? "sh";

  if (head === "env") {
    const lines = Object.entries(c.env).map(([k, v]) => ({ text: `${k}=${v}` }));
    return lines.length ? lines : [{ text: "(no custom environment variables)", tone: "dim" }];
  }
  if (head === "ls") {
    return [{ text: "app  bin  etc  lib  proc  srv  tmp  usr  var" }];
  }
  if (head === "hostname") return [{ text: c.name }];
  if (head === "whoami") return [{ text: c.env.USER ?? "root" }];
  if (head === "ping") {
    const target = cmd.find((x, i) => i > 0 && !x.startsWith("-"));
    if (!target) return [{ text: "ping: usage error: Destination address required", tone: "err" }];
    const peer = state.containers.find((x) => x.name === target && x.status === "running");
    const sameNet = peer && peer.network === c.network;
    if (!peer) return [{ text: `ping: bad address '${target}'`, tone: "err" }];
    if (!sameNet) {
      return [
        { text: `ping: bad address '${target}'`, tone: "err" },
        { text: `دو کانتینر در یک شبکه نیستند (${c.name}→${c.network} / ${peer.name}→${peer.network}).`, tone: "dim" },
      ];
    }
    if (c.network === "bridge") {
      return [
        { text: `ping: bad address '${target}'`, tone: "err" },
        { text: "در شبکه پیش‌فرض bridge، DNS داخلی وجود ندارد. شبکه اختصاصی بسازید.", tone: "dim" },
      ];
    }
    return [
      { text: `PING ${target} (172.19.0.3): 56 data bytes` },
      { text: `64 bytes from 172.19.0.3: seq=0 ttl=64 time=0.081 ms`, tone: "ok" },
      { text: `--- ${target} ping statistics ---` },
      { text: `1 packets transmitted, 1 packets received, 0% packet loss`, tone: "ok" },
    ];
  }
  if (head === "sh" || head === "bash") {
    return [
      { text: "/ # (interactive shell not available in this simulator)", tone: "dim" },
      { text: `Run commands directly instead, e.g.: docker exec ${c.name} env`, tone: "dim" },
    ];
  }
  return [{ text: `OCI runtime exec failed: exec: "${head}": executable file not found in $PATH`, tone: "err" }];
}

/* ── docker inspect ── */
function cmdInspect(state: LabState, args: string[]): OutLine[] {
  const ref = args.find((a) => !a.startsWith("-"));
  if (!ref) return [{ text: `"docker inspect" requires at least 1 argument.`, tone: "err" }];
  const c = findContainer(state, ref);
  if (c) {
    return [
      { text: "[" },
      { text: "  {" },
      { text: `    "Id": "${c.id}",` },
      { text: `    "Name": "/${c.name}",` },
      { text: `    "Image": "${c.image}",` },
      { text: `    "State": { "Status": "${c.status}", "ExitCode": ${c.exitCode} },` },
      { text: `    "Env": [${Object.entries(c.env).map(([k, v]) => `"${k}=${v}"`).join(", ")}],` },
      { text: `    "Mounts": [${c.volumes.map((v) => `"${v}"`).join(", ")}],` },
      { text: `    "Networks": { "${c.network}": {} }` },
      { text: "  }" },
      { text: "]" },
    ];
  }
  const v = state.volumes.find((x) => x.name === ref || x.name.startsWith(ref));
  if (v) {
    return [
      { text: "[" },
      { text: `  { "Name": "${v.name}", "Driver": "local",` },
      { text: `    "Mountpoint": "/var/lib/docker/volumes/${v.name}/_data" }` },
      { text: "]" },
    ];
  }
  const n = state.networks.find((x) => x.name === ref);
  if (n) {
    const members = state.containers.filter((c2) => c2.network === n.name);
    return [
      { text: "[" },
      { text: `  { "Name": "${n.name}", "Driver": "${n.driver}",` },
      { text: `    "Containers": [${members.map((m) => `"${m.name}"`).join(", ")}] }` },
      { text: "]" },
    ];
  }
  return [{ text: `Error: No such object: ${ref}`, tone: "err" }];
}

/* ── docker volume ── */
function cmdVolume(state: LabState, args: string[]): OutLine[] {
  const action = args[0];
  const rest = args.slice(1).filter((a) => !a.startsWith("-"));
  if (action === "create") {
    const name = rest[0];
    if (!name) return [{ text: "Error: volume name is required.", tone: "err" }];
    if (state.volumes.some((v) => v.name === name)) return [{ text: name }];
    state.volumes.push({ name, createdBy: "user" });
    return [{ text: name, tone: "ok" }];
  }
  if (action === "ls") {
    const dangling = args.includes("dangling=true");
    const list = dangling ? state.volumes.filter((v) => v.createdBy === "anonymous") : state.volumes;
    const out: OutLine[] = [{ text: `${pad("DRIVER", 12)}VOLUME NAME`, tone: "dim" }];
    if (!list.length) { out.push({ text: "No volumes found.", tone: "dim" }); return out; }
    list.forEach((v) =>
      out.push({ text: `${pad("local", 12)}${v.name}`, tone: v.createdBy === "anonymous" ? "warn" : undefined })
    );
    return out;
  }
  if (action === "rm") {
    if (!rest.length) return [{ text: "Error: volume name is required.", tone: "err" }];
    return rest.map((name) => {
      const v = state.volumes.find((x) => x.name === name);
      if (!v) return { text: `Error: No such volume: ${name}`, tone: "err" as const };
      const inUse = state.containers.find((c) => c.volumes.some((m) => m.startsWith(`${name}:`)));
      if (inUse) {
        return {
          text: `Error response from daemon: remove ${name}: volume is in use - [${inUse.id.slice(0, 12)}]`,
          tone: "err" as const,
        };
      }
      state.volumes = state.volumes.filter((x) => x.name !== name);
      return { text: name };
    });
  }
  if (action === "prune") {
    const used = new Set(state.containers.flatMap((c) => c.volumes.map((m) => m.split(":")[0])));
    const removed = state.volumes.filter((v) => !used.has(v.name));
    state.volumes = state.volumes.filter((v) => used.has(v.name));
    const out: OutLine[] = [{ text: "Deleted Volumes:" }];
    removed.forEach((v) => out.push({ text: v.name }));
    out.push({ text: `Total reclaimed space: ${removed.length * 41}MB`, tone: "ok" });
    return out;
  }
  if (action === "inspect") return cmdInspect(state, rest);
    return [{ text: `docker volume: '${action ?? ""}' is not supported. (create|ls|rm|prune|inspect)`, tone: "err" }];
}

/* ── docker network ── */
function cmdNetwork(state: LabState, args: string[]): OutLine[] {
  const action = args[0];
  const rest = args.slice(1).filter((a) => !a.startsWith("-"));
  if (action === "create") {
    const name = rest[0];
    if (!name) return [{ text: "Error: network name is required.", tone: "err" }];
    if (state.networks.some((n) => n.name === name)) {
      return [{ text: `Error response from daemon: network with name ${name} already exists`, tone: "err" }];
    }
    state.networks.push({ name, driver: "bridge" });
    return [{ text: makeId(state.seq++), tone: "ok" }];
  }
  if (action === "ls") {
    const out: OutLine[] = [{ text: `${pad("NETWORK ID", 15)}${pad("NAME", 20)}DRIVER`, tone: "dim" }];
    state.networks.forEach((n, i) =>
      out.push({ text: `${pad(makeId(i + 3).slice(0, 12), 15)}${pad(n.name, 20)}${n.driver}` })
    );
    return out;
  }
  if (action === "rm") {
    if (!rest.length) return [{ text: "Error: network name is required.", tone: "err" }];
    return rest.map((name) => {
      const n = state.networks.find((x) => x.name === name);
      if (!n) return { text: `Error: No such network: ${name}`, tone: "err" as const };
      if (n.builtin) return { text: `Error response from daemon: ${name} is a pre-defined network`, tone: "err" as const };
      const inUse = state.containers.find((c) => c.network === name && c.status === "running");
      if (inUse) {
        return { text: `Error response from daemon: network ${name} has active endpoints`, tone: "err" as const };
      }
      state.networks = state.networks.filter((x) => x.name !== name);
      return { text: name };
    });
  }
  if (action === "connect") {
    const [net, cref] = rest;
    const c = findContainer(state, cref ?? "");
    if (!state.networks.some((n) => n.name === net)) return [{ text: `Error: No such network: ${net}`, tone: "err" }];
    if (!c) return [{ text: `Error: No such container: ${cref}`, tone: "err" }];
    c.network = net;
    return [{ text: "", tone: "dim" }];
  }
  if (action === "inspect") return cmdInspect(state, rest);
  return [{ text: `docker network: '${action ?? ""}' is not supported. (create|ls|rm|connect|inspect)`, tone: "err" }];
}

/* ── help ── */
function helpText(): OutLine[] {
  return [
    { text: "Available commands in this lab:", tone: "ok" },
    { text: "" },
    { text: "  docker run [-d] [--name N] [-p H:C] [-v V:P] [-e K=V] [--network N] [--rm] IMAGE" },
    { text: "  docker ps [-a]              List containers" },
    { text: "  docker images               List local images" },
    { text: "  docker pull IMAGE           Download an image" },
    { text: "  docker logs NAME            View container output" },
    { text: "  docker stop|start NAME      Stop / start a container" },
    { text: "  docker rm [-f] NAME         Remove a container" },
    { text: "  docker rmi IMAGE            Remove an image" },
    { text: "  docker exec NAME CMD        Run a command inside a container (env|ls|ping|hostname)" },
    { text: "  docker inspect OBJ          Inspect container/volume/network" },
    { text: "  docker volume  create|ls|rm|prune|inspect" },
    { text: "  docker network create|ls|rm|connect|inspect" },
    { text: "  check                       Show objective status" },
    { text: "  clear                       Clear terminal" },
    { text: "" },
    { text: `Available images: ${REGISTRY_IMAGES.join("  ")}`, tone: "dim" },
  ];
}
