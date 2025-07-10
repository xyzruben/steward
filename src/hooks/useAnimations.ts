// ============================================================================
// ANIMATION HOOKS (see STEWARD_MASTER_SYSTEM_GUIDE.md - React State Patterns)
// ============================================================================
// Custom hooks for consistent animation states and interactions
// Follows master guide: React State Patterns, Component Hierarchy, Performance

import { useState, useCallback } from 'react'
import { useMotionValue, useTransform, useSpring } from 'framer-motion'
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/animations'

// ============================================================================
// USE HOVER HOOK (see master guide: React State Patterns)
// ============================================================================

interface UseHoverReturn {
  isHovered: boolean
  hoverProps: {
    onMouseEnter: () => void
    onMouseLeave: () => void
  }
}

export function useHover(): UseHoverReturn {
  const [isHovered, setIsHovered] = useState(false)

  const onMouseEnter = useCallback(() => setIsHovered(true), [])
  const onMouseLeave = useCallback(() => setIsHovered(false), [])

  return {
    isHovered,
    hoverProps: {
      onMouseEnter,
      onMouseLeave
    }
  }
}

// ============================================================================
// USE PRESS HOOK (see master guide: React State Patterns)
// ============================================================================

interface UsePressReturn {
  isPressed: boolean
  pressProps: {
    onMouseDown: () => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
}

export function usePress(): UsePressReturn {
  const [isPressed, setIsPressed] = useState(false)

  const onMouseDown = useCallback(() => setIsPressed(true), [])
  const onMouseUp = useCallback(() => setIsPressed(false), [])
  const onMouseLeave = useCallback(() => setIsPressed(false), [])

  return {
    isPressed,
    pressProps: {
      onMouseDown,
      onMouseUp,
      onMouseLeave
    }
  }
}

// ============================================================================
// USE FOCUS HOOK (see master guide: React State Patterns)
// ============================================================================

interface UseFocusReturn {
  isFocused: boolean
  focusProps: {
    onFocus: () => void
    onBlur: () => void
  }
}

export function useFocus(): UseFocusReturn {
  const [isFocused, setIsFocused] = useState(false)

  const onFocus = useCallback(() => setIsFocused(true), [])
  const onBlur = useCallback(() => setIsFocused(false), [])

  return {
    isFocused,
    focusProps: {
      onFocus,
      onBlur
    }
  }
}

// ============================================================================
// USE SCROLL PROGRESS HOOK (see master guide: Performance)
// ============================================================================

interface UseScrollProgressReturn {
  scrollYProgress: ReturnType<typeof useMotionValue>
  scrollY: ReturnType<typeof useMotionValue>
}

export function useScrollProgress(): UseScrollProgressReturn {
  const scrollYProgress = useMotionValue(0)
  const scrollY = useMotionValue(0)

  return {
    scrollYProgress,
    scrollY
  }
}

// ============================================================================
// USE PARALLAX HOOK (see master guide: Performance)
// ============================================================================

interface UseParallaxOptions {
  speed?: number
  offset?: number
}

interface UseParallaxReturn {
  y: ReturnType<typeof useTransform>
}

export function useParallax({ 
  speed = 0.5, 
  offset = 0 
}: UseParallaxOptions = {}): UseParallaxReturn {
  const scrollYProgress = useMotionValue(0)
  const y = useTransform(scrollYProgress, [0, 1], [offset, offset - 100 * speed])

  return { y }
}

// ============================================================================
// USE SPRING ANIMATION HOOK (see master guide: Performance)
// ============================================================================

interface UseSpringOptions {
  stiffness?: number
  damping?: number
  mass?: number
}

interface UseSpringReturn {
  springValue: ReturnType<typeof useSpring>
  setValue: (value: number) => void
}

export function useSpringAnimation(
  initialValue: number = 0,
  options: UseSpringOptions = {}
): UseSpringReturn {
  const { stiffness = 300, damping = 30, mass = 1 } = options
  
  const springValue = useSpring(initialValue, {
    stiffness,
    damping,
    mass
  })

  const setValue = useCallback((value: number) => {
    springValue.set(value)
  }, [springValue])

  return {
    springValue,
    setValue
  }
}

// ============================================================================
// USE ANIMATION SEQUENCE HOOK (see master guide: React State Patterns)
// ============================================================================

interface AnimationStep {
  id: string
  delay?: number
  duration?: number
  onComplete?: () => void
}

interface UseAnimationSequenceReturn {
  currentStep: string | null
  isPlaying: boolean
  play: (steps: AnimationStep[]) => void
  stop: () => void
  reset: () => void
}

export function useAnimationSequence(): UseAnimationSequenceReturn {
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((steps: AnimationStep[]) => {
    setIsPlaying(true)
    setCurrentStep(null)

    steps.forEach((step, index) => {
      const delay = step.delay || 0
      const duration = step.duration || ANIMATION_DURATION.normal

      setTimeout(() => {
        setCurrentStep(step.id)
        step.onComplete?.()
        
        if (index === steps.length - 1) {
          setIsPlaying(false)
          setCurrentStep(null)
        }
      }, delay + (index * duration * 1000))
    })
  }, [])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setCurrentStep(null)
  }, [])

  const reset = useCallback(() => {
    setIsPlaying(false)
    setCurrentStep(null)
  }, [])

  return {
    currentStep,
    isPlaying,
    play,
    stop,
    reset
  }
}

// ============================================================================
// USE INTERSECTION ANIMATION HOOK (see master guide: Performance)
// ============================================================================

interface UseIntersectionAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

interface UseIntersectionAnimationReturn {
  ref: (node: HTMLElement | null) => void
  isInView: boolean
  hasAnimated: boolean
}

export function useIntersectionAnimation({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
}: UseIntersectionAnimationOptions = {}): UseIntersectionAnimationReturn {
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  const ref = useCallback((node: HTMLElement | null) => {
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            if (triggerOnce) {
              setHasAnimated(true)
            }
          } else if (!triggerOnce) {
            setIsInView(false)
          }
        },
        { threshold, rootMargin }
      )

      observer.observe(node)

      return () => observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return {
    ref,
    isInView,
    hasAnimated
  }
}

// ============================================================================
// USE ANIMATION CONTROLS HOOK (see master guide: React State Patterns)
// ============================================================================

interface UseAnimationControlsReturn {
  isAnimating: boolean
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
}

export function useAnimationControls(): UseAnimationControlsReturn {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const start = useCallback(() => {
    setIsAnimating(true)
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    setIsAnimating(false)
    setIsPaused(false)
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  return {
    isAnimating: isAnimating && !isPaused,
    start,
    stop,
    pause,
    resume
  }
}

// ============================================================================
// USE REDUCED MOTION HOOK (see master guide: Accessibility)
// ============================================================================

interface UseReducedMotionReturn {
  prefersReducedMotion: boolean
  shouldReduceMotion: boolean
}

export function useReducedMotion(): UseReducedMotionReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useState(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  })

  return {
    prefersReducedMotion,
    shouldReduceMotion: prefersReducedMotion
  }
}

// ============================================================================
// USE ANIMATION PREFERENCE HOOK (see master guide: Accessibility)
// ============================================================================

interface UseAnimationPreferenceReturn {
  animationEnabled: boolean
  toggleAnimation: () => void
  setAnimationEnabled: (enabled: boolean) => void
}

export function useAnimationPreference(): UseAnimationPreferenceReturn {
  const [animationEnabled, setAnimationEnabled] = useState(true)
  const { shouldReduceMotion } = useReducedMotion()

  const toggleAnimation = useCallback(() => {
    setAnimationEnabled(prev => !prev)
  }, [])

  const setAnimationEnabledState = useCallback((enabled: boolean) => {
    setAnimationEnabled(enabled)
  }, [])

  return {
    animationEnabled: animationEnabled && !shouldReduceMotion,
    toggleAnimation,
    setAnimationEnabled: setAnimationEnabledState
  }
} 