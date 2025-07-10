// ============================================================================
// ANIMATION UTILITIES (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium animation system with consistent timing, easing, and variants
// Follows master guide: Component Hierarchy, Performance, Accessibility

import { Variants, Transition, Easing } from 'framer-motion'
import { isMobileDevice } from '@/lib/utils'

// ============================================================================
// ANIMATION CONSTANTS (see master guide: Code Quality and Conventions)
// ============================================================================

export const ANIMATION_DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8
} as const

export const ANIMATION_EASING = {
  easeOut: [0.4, 0, 0.2, 1] as Easing,
  easeIn: [0.4, 0, 1, 1] as Easing,
  easeInOut: [0.4, 0, 0.2, 1] as Easing,
  spring: [0.25, 0.46, 0.45, 0.94] as Easing,
  bounce: [0.68, -0.55, 0.265, 1.55] as Easing
} as const

export const ANIMATION_DELAY = {
  none: 0,
  small: 0.05,
  medium: 0.1,
  large: 0.2
} as const

// ============================================================================
// BASE TRANSITIONS (see master guide: Performance)
// ============================================================================

export const baseTransition: Transition = {
  duration: ANIMATION_DURATION.normal,
  ease: ANIMATION_EASING.easeOut
}

export const fastTransition: Transition = {
  duration: ANIMATION_DURATION.fast,
  ease: ANIMATION_EASING.easeOut
}

export const slowTransition: Transition = {
  duration: ANIMATION_DURATION.slow,
  ease: ANIMATION_EASING.easeInOut
}

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
}

export const bounceTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 10
}

// ============================================================================
// COMMON ANIMATION VARIANTS (see master guide: Component Hierarchy)
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const fadeInUp: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: baseTransition
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: fastTransition
  }
}

export const fadeInDown: Variants = {
  initial: { 
    opacity: 0, 
    y: -20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: baseTransition
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: fastTransition
  }
}

export const fadeInLeft: Variants = {
  initial: { 
    opacity: 0, 
    x: -20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: baseTransition
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: fastTransition
  }
}

export const fadeInRight: Variants = {
  initial: { 
    opacity: 0, 
    x: 20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: baseTransition
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: fastTransition
  }
}

export const scaleIn: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.9 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: fastTransition
  }
}

export const slideInUp: Variants = {
  initial: { 
    y: '100%' 
  },
  animate: { 
    y: 0,
    transition: springTransition
  },
  exit: { 
    y: '100%',
    transition: fastTransition
  }
}

export const slideInDown: Variants = {
  initial: { 
    y: '-100%' 
  },
  animate: { 
    y: 0,
    transition: springTransition
  },
  exit: { 
    y: '-100%',
    transition: fastTransition
  }
}

// ============================================================================
// INTERACTIVE ANIMATION VARIANTS (see master guide: Component Hierarchy)
// ============================================================================

export const hoverScale: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: fastTransition
  },
  tap: { 
    scale: 0.98,
    transition: fastTransition
  }
}

export const hoverLift: Variants = {
  initial: { 
    y: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  hover: { 
    y: -2,
    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: baseTransition
  },
  tap: { 
    y: 0,
    transition: fastTransition
  }
}

export const buttonHover: Variants = {
  initial: { 
    scale: 1,
    backgroundColor: 'var(--button-bg)'
  },
  hover: { 
    scale: 1.02,
    backgroundColor: 'var(--button-hover-bg)',
    transition: fastTransition
  },
  tap: { 
    scale: 0.98,
    transition: fastTransition
  }
}

export const cardHover: Variants = {
  initial: { 
    y: 0,
    scale: 1,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  hover: { 
    y: -4,
    scale: 1.01,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: baseTransition
  }
}

export const inputFocus: Variants = {
  initial: { 
    scale: 1,
    borderColor: 'var(--border-color)'
  },
  focus: { 
    scale: 1.01,
    borderColor: 'var(--primary-color)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    transition: fastTransition
  }
}

// ============================================================================
// STAGGER ANIMATIONS (see master guide: Performance)
// ============================================================================

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: ANIMATION_DELAY.medium,
      delayChildren: ANIMATION_DELAY.small
    }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: baseTransition
  }
}

export const staggerFast: Variants = {
  animate: {
    transition: {
      staggerChildren: ANIMATION_DELAY.small
    }
  }
}

export const staggerSlow: Variants = {
  animate: {
    transition: {
      staggerChildren: ANIMATION_DELAY.large
    }
  }
}

// ============================================================================
// LOADING ANIMATIONS (see master guide: Component Hierarchy)
// ============================================================================

export const pulse: Variants = {
  initial: { opacity: 0.6 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut'
    }
  }
}

export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: { 
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

export const bounce: Variants = {
  initial: { y: 0 },
  animate: { 
    y: [-10, 0, -10],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

export const rotate: Variants = {
  initial: { rotate: 0 },
  animate: { 
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

// ============================================================================
// PAGE TRANSITIONS (see master guide: Component Hierarchy)
// ============================================================================

export const pageTransition: Variants = {
  initial: { 
    opacity: 0,
    x: 20
  },
  animate: { 
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut
    }
  },
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: ANIMATION_EASING.easeIn
    }
  }
}

export const modalTransition: Variants = {
  initial: { 
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: fastTransition
  }
}

// ============================================================================
// UTILITY FUNCTIONS (see master guide: Code Quality and Conventions)
// ============================================================================

export const createStagger = (delay: number = ANIMATION_DELAY.medium): Variants => ({
  animate: {
    transition: {
      staggerChildren: delay
    }
  }
})

export const createHoverScale = (scale: number = 1.02): Variants => ({
  initial: { scale: 1 },
  hover: { 
    scale,
    transition: fastTransition
  },
  tap: { 
    scale: scale * 0.98,
    transition: fastTransition
  }
})

export const createFadeIn = (direction: 'up' | 'down' | 'left' | 'right' = 'up'): Variants => {
  const variants = {
    up: fadeInUp,
    down: fadeInDown,
    left: fadeInLeft,
    right: fadeInRight
  }
  return variants[direction]
}

// ============================================================================
// ANIMATION PRESETS (see master guide: Component Hierarchy)
// ============================================================================

export const ANIMATION_PRESETS = {
  // Card animations
  card: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -4, scale: 1.01 },
    transition: baseTransition
  },
  
  // Button animations
  button: {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    transition: fastTransition
  },
  
  // List item animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: baseTransition
  },
  
  // Form animations
  form: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: slowTransition
  },
  
  // Loading animations
  loading: {
    initial: { opacity: 0.6 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse'
      }
    }
  }
} as const 

export const mobileTap: Variants = {
  initial: { scale: 1 },
  tap: {
    scale: 0.97,
    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
    transition: fastTransition
  }
}

export const mobileCardTap: Variants = {
  initial: { scale: 1, y: 0 },
  tap: {
    scale: 0.98,
    y: 2,
    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.10)',
    transition: fastTransition
  }
}

/**
 * Returns the appropriate hover/tap variant for the current device.
 * Use for buttons, cards, etc. to provide premium mobile feedback.
 */
export function getResponsiveHoverScale(): Variants {
  return isMobileDevice() ? mobileTap : hoverScale
}

export function getResponsiveCardHover(): Variants {
  return isMobileDevice() ? mobileCardTap : cardHover
} 