// ============================================================================
// ANIMATION UTILITIES TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for animation utility functions
// Follows master guide: Testing and Quality Assurance, Unit Testing Strategy

import { 
  getPageTransition, 
  fadeInUp, 
  fadeInDown, 
  fadeInLeft, 
  fadeInRight,
  scaleIn,
  slideInUp,
  slideInDown,
  staggerContainer,
  staggerItem
} from '../animations'

// ============================================================================
// TEST SUITE (see master guide: Unit Testing Strategy)
// ============================================================================

describe('Animation Utilities', () => {
  // ============================================================================
  // PAGE TRANSITION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('getPageTransition', () => {
    it('returns fade transition by default', () => {
      const transition = getPageTransition()
      
      expect(transition).toHaveProperty('initial')
      expect(transition).toHaveProperty('animate')
      expect(transition).toHaveProperty('exit')
      expect(transition.initial).toEqual({ opacity: 0 })
      expect(transition.animate).toMatchObject({ opacity: 1 })
      expect(transition.exit).toMatchObject({ opacity: 0 })
    })

    it('returns fade transition when explicitly requested', () => {
      const transition = getPageTransition('fade')
      
      expect(transition.initial).toEqual({ opacity: 0 })
      expect(transition.animate).toMatchObject({ opacity: 1 })
      expect(transition.exit).toEqual({ opacity: 0 })
    })

    it('returns slide-up transition', () => {
      const transition = getPageTransition('slide-up')
      
      expect(transition.initial).toMatchObject({ 
        opacity: 0, 
        y: expect.any(Number)
      })
      expect(transition.animate).toMatchObject({ 
        opacity: 1, 
        y: 0 
      })
      expect(transition.exit).toMatchObject({ 
        opacity: 0, 
        y: expect.any(Number)
      })
    })

    it('returns slide-right transition', () => {
      const transition = getPageTransition('slide-right')
      
      expect(transition.initial).toMatchObject({ 
        opacity: 0, 
        x: expect.any(Number)
      })
      expect(transition.animate).toMatchObject({ 
        opacity: 1, 
        x: 0 
      })
      expect(transition.exit).toMatchObject({ 
        opacity: 0, 
        x: expect.any(Number)
      })
    })

    it('returns scale transition', () => {
      const transition = getPageTransition('scale')
      
      expect(transition.initial).toMatchObject({ 
        opacity: 0, 
        scale: expect.any(Number)
      })
      expect(transition.animate).toMatchObject({ 
        opacity: 1, 
        scale: 1 
      })
      expect(transition.exit).toMatchObject({ 
        opacity: 0, 
        scale: expect.any(Number)
      })
    })

    it('handles invalid transition type gracefully', () => {
      const transition = getPageTransition('invalid' as any)
      
      // Should fall back to fade transition
      expect(transition.initial).toEqual({ opacity: 0 })
      expect(transition.animate).toMatchObject({ opacity: 1 })
      expect(transition.exit).toEqual({ opacity: 0 })
    })
  })

  // ============================================================================
  // BASIC ANIMATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Basic Animations', () => {
    it('fadeInUp has correct properties', () => {
      expect(fadeInUp).toHaveProperty('initial')
      expect(fadeInUp).toHaveProperty('animate')
      expect(fadeInUp.initial).toMatchObject({ 
        opacity: 0, 
        y: expect.any(Number)
      })
      expect(fadeInUp.animate).toMatchObject({ 
        opacity: 1, 
        y: 0 
      })
    })

    it('fadeInDown has correct properties', () => {
      expect(fadeInDown).toHaveProperty('initial')
      expect(fadeInDown).toHaveProperty('animate')
      expect(fadeInDown.initial).toMatchObject({ 
        opacity: 0, 
        y: expect.any(Number)
      })
      expect(fadeInDown.animate).toMatchObject({ 
        opacity: 1, 
        y: 0 
      })
    })

    it('scaleIn has correct properties', () => {
      expect(scaleIn).toHaveProperty('initial')
      expect(scaleIn).toHaveProperty('animate')
      expect(scaleIn.initial).toMatchObject({ 
        opacity: 0, 
        scale: expect.any(Number)
      })
      expect(scaleIn.animate).toMatchObject({ 
        opacity: 1, 
        scale: 1 
      })
    })
  })

  // ============================================================================
  // SLIDE ANIMATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Slide Animations', () => {
    it('slideInUp has correct properties', () => {
      expect(slideInUp).toHaveProperty('initial')
      expect(slideInUp).toHaveProperty('animate')
      expect(slideInUp.initial).toMatchObject({ 
        y: expect.any(String)
      })
      expect(slideInUp.animate).toMatchObject({ 
        y: 0
      })
    })

    it('slideInDown has correct properties', () => {
      expect(slideInDown).toHaveProperty('initial')
      expect(slideInDown).toHaveProperty('animate')
      expect(slideInDown.initial).toMatchObject({ 
        y: expect.any(String)
      })
      expect(slideInDown.animate).toMatchObject({ 
        y: 0
      })
    })
  })

  // ============================================================================
  // STAGGER ANIMATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Stagger Animations', () => {
    it('staggerContainer has correct properties', () => {
      expect(staggerContainer).toHaveProperty('animate')
      expect(staggerContainer.animate).toHaveProperty('transition')
      expect((staggerContainer.animate as any).transition).toHaveProperty('staggerChildren')
      expect((staggerContainer.animate as any).transition.staggerChildren).toBe(0.1)
      expect((staggerContainer.animate as any).transition).toHaveProperty('delayChildren')
    })

    it('staggerItem has correct properties', () => {
      expect(staggerItem).toHaveProperty('initial')
      expect(staggerItem).toHaveProperty('animate')
      expect(staggerItem.initial).toMatchObject({ 
        opacity: 0, 
        y: expect.any(Number)
      })
      expect(staggerItem.animate).toMatchObject({ 
        opacity: 1, 
        y: 0 
      })
    })
  })

  // ============================================================================
  // PERFORMANCE TESTS (see master guide: Performance)
  // ============================================================================

  describe('Performance', () => {
    it('getPageTransition returns quickly', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        getPageTransition('fade')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete 1000 calls in under 10ms
      expect(totalTime).toBeLessThan(10)
    })

    it('all animation variants are properly structured', () => {
      const animations = [
        fadeInUp, fadeInDown, fadeInLeft, fadeInRight,
        scaleIn, slideInUp, slideInDown,
        staggerContainer, staggerItem
      ]

      animations.forEach(animation => {
        expect(animation).toBeDefined()
        expect(typeof animation).toBe('object')
        
        if (animation.initial) {
          expect(typeof animation.initial).toBe('object')
        }
        if (animation.animate) {
          expect(typeof animation.animate).toBe('object')
        }
      })
    })
  })
}) 