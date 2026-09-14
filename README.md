# ⚓ بندرِ داکر (Docker Harbor)
### An Interactive, Scenario-Based Docker Learning Platform in Persian

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://0antuosh0-create.github.io/persian-docker-learning-platform/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)

[🇮🇷 **مشاهده مستندات به زبان فارسی (README.fa.md)**](./README.fa.md)

---

## 🌊 Overview

**Docker Harbor (بندرِ داکر)** is an open-source, interactive learning platform designed for Persian-speaking software engineers and DevOps practitioners. 

Unlike traditional passive courses or text-heavy documentation, Docker Harbor is built around a **"Learn by Doing"** philosophy. It runs a full-featured client-side Docker engine simulator directly in the browser—allowing learners to explore container lifecycles, build multi-stage images, configure networks, and solve production incidents with zero server requirements and without needing Docker Desktop installed on their machines.

---

## ✨ Key Features

- **🚀 16 Comprehensive Engineering Lessons across 6 Modules:**
  1. **Containers 101:** Virtual Machines vs. Linux Namespaces & Cgroups, core primitives.
  2. **Building Images:** Layer caching mechanics, BuildKit invalidation rules, immutable digests.
  3. **Data & Storage:** Overcoming OverlayFS Copy-on-Write overhead with Named Volumes, Bind Mounts, and `tmpfs`.
  4. **Networking & DNS:** User-defined bridge networks, container isolation, and Docker's embedded DNS server (`127.0.0.11`).
  5. **Docker Compose & Healthchecks:** Production-grade `healthcheck` configurations, `depends_on: condition: service_healthy`, and Docker secrets.
  6. **Production Security & Operations:** Distroless/Scratch images, CVE vulnerability scanning, Linux OOM Killer mechanics (`Exit Code 137`), and PID 1 signal-handling traps.

- **💻 Interactive Docker Lab (In-Browser Terminal):**
  - Live Docker Engine simulator with persistent state.
  - Realistic command execution, terminal output streaming, and real-time objective validation.
  - Built-in command history, tab autocomplete, and tmux-style status bar.
  - 100% English developer CLI experience with authentic monospace typography.

- **📑 Quick Reference & Command Cheatsheet:**
  - Categorized catalog of essential Docker commands (Lifecycle, Images, Debug, Storage, Network, Compose, Dockerfile, Security).
  - One-click copy-to-clipboard with real-time feedback.
  - Interactive bookmarking (Favorites) and fast fuzzy search (`/` or `Ctrl+K`).
  - Embedded real-world engineering tips and destructive command warnings.

- **💾 Progress Backup & Restore (JSON Export & Import):**
  - Download all learning progress, completed lessons, lab missions, and favorited commands into a portable `.json` file.
  - Easily restore state on another machine or browser with schema validation and error protection.

- **🎨 Neo-Brutalist Nautical Harbor Aesthetic:**
  - Tactile, modern visual language inspired by shipping dockyards, containers, and terminal tools.
  - Custom Persian typography with **Vazirmatn** and coding fonts with **JetBrains Mono** and **Fira Code**.
  - Accessible, fully responsive (desktop, tablet, mobile), and motion-reduced friendly.

---

## 🛠 Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling:** [Vite 7](https://vite.dev/) + [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + Scoped CSS Modules
- **Animation:** [Framer Motion](https://motion.dev/)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **Typography:** [Vazirmatn](https://github.com/rastikerdar/vazirmatn), [JetBrains Mono](https://www.jetbrains.com/lp/mono/), [Fira Code](https://github.com/tonsky/FiraCode)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/0antuosh0-create/persian-docker-learning-platform.git
   cd persian-docker-learning-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The production-ready standalone distribution will be generated in the `dist/` directory.

5. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## 📦 Project Structure

```text
persian-docker-learning-platform/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Pages CI/CD workflow
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── BackupModal.tsx   # Progress Export/Import modal dialog
│   │   ├── BackupModal.css
│   │   ├── Cheatsheet.tsx    # Docker command notebook & search
│   │   ├── Cheatsheet.css
│   │   ├── DockerLab.tsx     # Interactive in-browser terminal simulator
│   │   ├── DockerLab.css
│   │   ├── Footer.tsx        # Responsive coastal harbor footer
│   │   ├── Footer.css
│   │   ├── Home.tsx          # Main course roadmap & topbar
│   │   ├── LessonPlayer.tsx  # Step-by-step interactive lesson engine
│   │   └── StepBlocks.tsx    # Interactive quiz, spot-error & code blocks
│   ├── data/
│   │   ├── course.ts         # 16 in-depth lessons & curriculum definition
│   │   ├── lab.ts            # Lab scenarios, roles, and automated checks
│   │   └── reference.ts      # Command notebook catalog & explanations
│   ├── lib/
│   │   └── dockerSim.ts      # In-browser Docker engine state & command parser
│   ├── utils/
│   │   ├── backup.ts         # JSON serialization & validation helpers
│   │   ├── clipboard.ts      # Resilient clipboard copy helper
│   │   └── cn.ts             # Tailwind classnames merger
│   ├── App.tsx               # Root application router & progress state
│   ├── index.css             # Global theme, paper background & topbar
│   └── main.tsx              # React application entrypoint
├── index.html                # HTML entrypoint
├── package.json
├── tsconfig.json
└── vite.config.ts            # Singlefile build & path alias configuration
```

---

## 🌐 Live Deployment on GitHub Pages

This project is configured with GitHub Actions to automatically build and deploy to GitHub Pages on every push to the `main` branch.

Live URL: **[https://0antuosh0-create.github.io/persian-docker-learning-platform/](https://0antuosh0-create.github.io/persian-docker-learning-platform/)**

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add new lessons, refine explanations, add new lab challenges, or report an issue:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-scenario`)
3. Commit your Changes (`git commit -m 'feat: add compose healthcheck scenario'`)
4. Push to the Branch (`git push origin feature/amazing-scenario`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<div align="center">
  <sub>ساخته‌شده با ♥ برای توسعه‌دهندگان و مهندسان فارسی‌زبان</sub>
</div>
