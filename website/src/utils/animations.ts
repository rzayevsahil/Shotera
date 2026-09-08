import { Variants } from 'motion/react';

// General gentle fade up (replaces the blurry dust reveal)
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: custom * 0.1,
      ease: [0.25, 0.1, 0.25, 1.0], // smooth cubic-bezier
    },
  }),
};

// Aliased so we don't break existing imports immediately, but it's now just a fade-up
export const dustRevealVariants = fadeUpVariants;

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: custom * 0.1,
      ease: 'easeOut',
    },
  }),
};

export const fadeLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: custom * 0.1,
      ease: 'easeOut',
    },
  }),
};

export const fadeRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: custom * 0.1,
      ease: 'easeOut',
    },
  }),
};
