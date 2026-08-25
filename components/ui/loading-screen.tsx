"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-background px-6 text-sm text-muted-foreground"><div className="flex flex-col items-center gap-5 text-center" role="status" aria-live="polite"><motion.span className="grid size-14 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/15" animate={{ scale: [1, 1.06, 1], rotate: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>F</motion.span><div><p className="font-display text-base font-semibold text-foreground">Finansee</p><motion.p className="mt-1" animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 1.4, repeat: Infinity }}>Carregando seu panorama financeiro...</motion.p></div></div></main>;
}
