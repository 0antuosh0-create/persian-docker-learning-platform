import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Home } from "./components/Home";
import { LessonPlayer } from "./components/LessonPlayer";
import { Cheatsheet } from "./components/Cheatsheet";
import { DockerLab } from "./components/DockerLab";

const STORAGE_KEY = "bandar-docker-progress-v1";

type View = { type: "home" } | { type: "lesson"; id: string } | { type: "cheatsheet" } | { type: "lab" };

export default function App() {
  const [view, setView] = useState<View>({ type: "home" });
  const reduceMotion = useReducedMotion();
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }, [completed]);

  const markComplete = (id: string) =>
    setCompleted((list) => (list.includes(id) ? list : [...list, id]));

  const resetProgress = () => {
    setCompleted([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fade = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: reduceMotion ? 0 : -8, scale: reduceMotion ? 1 : 0.995 },
    transition: { duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div dir="rtl">
      <div className="app-bg" aria-hidden="true">
        <div className="app-bg-rays" />
        <div className="app-bg-grid" />
        <div className="app-bg-glow app-bg-glow-1" />
        <div className="app-bg-glow app-bg-glow-2" />
        <div className="app-bg-glow app-bg-glow-3" />
        <span className="float-shape fs-1" />
        <span className="float-shape fs-2" />
        <span className="float-shape fs-3" />
        <span className="float-shape fs-4" />
        <span className="float-shape fs-5" />
        <span className="float-shape fs-6" />
      </div>
      <AnimatePresence mode="wait">
        {view.type === "home" && (
          <motion.div key="home" {...fade}>
            <Home
              completed={completed}
              onOpen={(id) => setView({ type: "lesson", id })}
              onOpenCheatsheet={() => setView({ type: "cheatsheet" })}
              onOpenLab={() => setView({ type: "lab" })}
              onResetProgress={resetProgress}
              onRestoreProgress={(newCompleted) => setCompleted(newCompleted)}
            />
          </motion.div>
        )}
        {view.type === "lesson" && (
          <motion.div key={`lesson-${view.id}`} {...fade}>
            <LessonPlayer
              lessonId={view.id}
              onExit={() => setView({ type: "home" })}
              onComplete={markComplete}
              onNext={(id) => setView(id ? { type: "lesson", id } : { type: "home" })}
            />
          </motion.div>
        )}
        {view.type === "cheatsheet" && (
          <motion.div key="cheatsheet" {...fade}>
            <Cheatsheet onBack={() => setView({ type: "home" })} />
          </motion.div>
        )}
        {view.type === "lab" && (
          <motion.div key="lab" {...fade}>
            <DockerLab onBack={() => setView({ type: "home" })} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
