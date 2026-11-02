export const EASE = [0.22, 1, 0.36, 1];

// True on devices with a precise pointer that can hover (mouse / trackpad).
export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
