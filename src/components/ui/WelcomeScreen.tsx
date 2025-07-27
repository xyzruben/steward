// ============================================================================
// WELCOME SCREEN COMPONENT
// ============================================================================
// Beautiful welcome screen for new users with AI Financial Assistant introduction
// See: Master System Guide - React Component Standards, TypeScript Standards

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Clock,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onTakeTour: () => void;
  className?: string;
}

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

// ============================================================================
// FEATURE CARDS DATA
// ============================================================================

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'Natural Language Chat',
    description: 'Ask questions in plain English and get instant financial insights',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'AI-Powered Analysis',
    description: 'Intelligent spending pattern recognition and anomaly detection',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Advanced Analytics',
    description: 'Comprehensive charts, trends, and financial health metrics',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Trend Tracking',
    description: 'Monitor your spending habits and financial progress over time',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Bank-Level Security',
    description: 'Enterprise-grade encryption and privacy protection',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: 'Smart Goals',
    description: 'Set and track financial goals with AI-powered recommendations',
    color: 'from-indigo-500 to-indigo-600',
  },
];

// ============================================================================
// WELCOME SCREEN COMPONENT
// ============================================================================

export function WelcomeScreen({ onGetStarted, onTakeTour, className }: WelcomeScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-rotate features
  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % FEATURE_CARDS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}>
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-slate-700 shadow-lg border-4 border-slate-200 dark:border-slate-600">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Steward
            </h1>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Your AI Financial Assistant
          </h2>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Transform your financial management with intelligent insights, natural language queries, and AI-powered analysis.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-slate-600 dark:text-slate-400">10,000+ Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-slate-600 dark:text-slate-400">4.9/5 Rating</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-slate-600 dark:text-slate-400">24/7 AI Support</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button
              onClick={onTakeTour}
              variant="outline"
              size="lg"
              className="border-2 border-slate-300 dark:border-slate-600 px-8 py-3 text-lg font-semibold"
            >
              Take a Tour
            </Button>
          </div>
        </motion.div>

        {/* Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-12">
            Powerful Features at Your Fingertips
          </h3>

          {/* Featured Feature Card */}
          <div className="max-w-4xl mx-auto mb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white dark:bg-slate-800 shadow-xl border-0">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-full bg-gradient-to-r ${FEATURE_CARDS[currentFeature].color} text-white`}>
                        {FEATURE_CARDS[currentFeature].icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                          {FEATURE_CARDS[currentFeature].title}
                        </h4>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                          {FEATURE_CARDS[currentFeature].description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`bg-white dark:bg-slate-800 shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer ${
                  index === currentFeature ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white mb-4`}>
                      {feature.icon}
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
            Why Choose Steward?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Easy to Use
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Natural language interface makes financial management intuitive and accessible
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                AI-Powered
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced AI provides intelligent insights and personalized recommendations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Secure & Private
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Bank-level security ensures your financial data is always protected
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Transform Your Financial Management?
              </h3>
              <p className="text-blue-100 mb-6 text-lg">
                Join thousands of users who are already using AI to make smarter financial decisions
              </p>
              <Button
                onClick={onGetStarted}
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 