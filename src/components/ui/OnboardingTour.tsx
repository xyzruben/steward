// ============================================================================
// ONBOARDING TOUR COMPONENT
// ============================================================================
// Interactive onboarding tour for new users to discover AI Financial Assistant features
// See: Master System Guide - React Component Standards, TypeScript Standards

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle
} from 'lucide-react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

// ============================================================================
// TOUR STEPS CONFIGURATION
// ============================================================================

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your AI Financial Assistant! 🤖',
    description: 'Meet your intelligent companion for understanding and managing your financial data. Ask questions in natural language and get instant insights!',
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
  },
  {
    id: 'chat-interface',
    title: 'Natural Language Chat',
    description: 'Simply type your questions like "How much did I spend on food last month?" or "Show me my top merchants" and get instant answers.',
    icon: <MessageSquare className="h-6 w-6 text-green-500" />,
    target: '.agent-chat-input',
    position: 'top',
  },
  {
    id: 'ai-insights',
    title: 'AI-Powered Insights',
    description: 'Get intelligent insights about your spending patterns, trends, and financial health. The AI analyzes your data to provide actionable recommendations.',
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    target: '.agent-insights',
    position: 'bottom',
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Explore detailed analytics with charts, trends, and breakdowns. Understand your spending habits and identify opportunities for improvement.',
    icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
    target: '.analytics-dashboard',
    position: 'left',
  },
  {
    id: 'trends',
    title: 'Trend Analysis',
    description: 'Track your spending trends over time and see how your financial habits are evolving. Identify patterns and make informed decisions.',
    icon: <TrendingUp className="h-6 w-6 text-orange-500" />,
    target: '.trends-section',
    position: 'right',
  },
  {
    id: 'security',
    title: 'Bank-Level Security',
    description: 'Your financial data is protected with enterprise-grade security. All data is encrypted and you have full control over your information.',
    icon: <Shield className="h-6 w-6 text-red-500" />,
  },
  {
    id: 'complete',
    title: "You're All Set! 🎉",
    description: 'Start exploring your financial data with AI-powered insights. Try asking questions about your spending patterns and discover new ways to manage your finances.',
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    action: {
      label: 'Start Exploring',
      onClick: () => {},
    },
  },
];

// ============================================================================
// ONBOARDING TOUR COMPONENT
// ============================================================================

export function OnboardingTour({ isVisible, onComplete, onSkip, className }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);

  // ============================================================================
  // STEP NAVIGATION
  // ============================================================================

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // ============================================================================
  // HIGHLIGHTING LOGIC
  // ============================================================================

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (step.target) {
      setIsHighlighting(true);
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setIsHighlighting(false);
    }
  }, [currentStep, isVisible]);

  // ============================================================================
  // PROGRESS CALCULATION
  // ============================================================================

  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const currentStepData = TOUR_STEPS[currentStep];

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}>
      {/* Highlight overlay */}
      {isHighlighting && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Tour card */}
      <Card className="w-full max-w-md mx-4 relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentStepData.icon}
              <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Step {currentStep + 1} of {TOUR_STEPS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-base leading-relaxed">
            {currentStepData.description}
          </CardDescription>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={skipTour}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
              
              {currentStepData.action ? (
                <Button onClick={currentStepData.action.onClick} className="flex items-center space-x-2">
                  <span>{currentStepData.action.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={nextStep} className="flex items-center space-x-2">
                  <span>{currentStep === TOUR_STEPS.length - 1 ? 'Complete' : 'Next'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help indicator */}
      <div className="absolute bottom-4 right-4">
        <Badge variant="secondary" className="flex items-center space-x-2">
          <HelpCircle className="h-4 w-4" />
          <span>Need help? Click the help icon anytime</span>
        </Badge>
      </div>
    </div>
  );
}

// ============================================================================
// TOUR HOOK
// ============================================================================

export function useOnboardingTour() {
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  const startTour = useCallback(() => {
    setIsTourVisible(true);
  }, []);

  const completeTour = useCallback(() => {
    setIsTourVisible(false);
    setHasCompletedTour(true);
    // Store in localStorage
    localStorage.setItem('steward-tour-completed', 'true');
  }, []);

  const skipTour = useCallback(() => {
    setIsTourVisible(false);
    setHasCompletedTour(true);
    // Store in localStorage
    localStorage.setItem('steward-tour-completed', 'true');
  }, []);

  // Check if user has completed tour
  useEffect(() => {
    const completed = localStorage.getItem('steward-tour-completed') === 'true';
    setHasCompletedTour(completed);
  }, []);

  return {
    isTourVisible,
    hasCompletedTour,
    startTour,
    completeTour,
    skipTour,
  };
} 