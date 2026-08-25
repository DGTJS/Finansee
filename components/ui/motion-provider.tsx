"use client";

import { MotionConfig } from "framer-motion";
import { RouteTransition } from "@/components/ui/route-transition";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}><RouteTransition>{children}</RouteTransition></MotionConfig>;
}
