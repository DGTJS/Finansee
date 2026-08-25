"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "@/components/icons";

export function GreetingVisual({ night }: { night: boolean }) {
  return <span className="relative ml-2 inline-grid size-7 align-middle"><AnimatePresence mode="wait" initial={false}>{night ? <motion.span key="moon" initial={{ opacity: 0, y: 8, rotate: -25 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -8, rotate: 25 }}><Moon className="size-6 text-primary" /></motion.span> : <motion.span key="sun" initial={{ opacity: 0, y: 8, rotate: -25 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -8, rotate: 25 }}><Sun className="size-6 text-primary" /></motion.span>}</AnimatePresence></span>;
}
