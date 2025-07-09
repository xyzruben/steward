// ============================================================================
// USER PROFILE PAGE
// ============================================================================
// User profile and preferences management page
// See: Master System Guide - Frontend Architecture, UI Components

'use client'

import React, { useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { SharedNavigation } from '@/components/ui/SharedNavigation'
import { 
  User, 
  Settings, 
  Download, 
  Shield, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { NotificationToast } from '@/components/ui/NotificationToast'

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProfilePage() {
  const {
    profile,
    preferences,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    refreshProfile
  } = useUserProfile()

  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // ============================================================================
  // FORM STATE
  // ============================================================================

  const [personalInfo, setPersonalInfo] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || ''
  })

  const [displaySettings, setDisplaySettings] = useState({
    theme: preferences?.display?.theme || 'system',
    compactMode: preferences?.display?.compactMode || false,
    dateFormat: preferences?.display?.dateFormat || 'MM/DD/YYYY',
    timeFormat: preferences?.display?.timeFormat || '12h',
    currency: preferences?.display?.currency || 'USD',
    locale: preferences?.display?.locale || 'en-US'
  })

  const [exportSettings, setExportSettings] = useState({
    format: preferences?.export?.format || 'csv',
    includeAnalytics: preferences?.export?.includeAnalytics || false,
    dateRange: preferences?.export?.dateRange || '30d'
  })

  const [privacySettings, setPrivacySettings] = useState({
    allowDataAnalytics: preferences?.analytics?.allowsDataAnalytics ?? true,
    shareUsageData: profile?.shareUsageData || false
  })

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSavePersonalInfo = async () => {
    try {
      setIsSaving(true)
      await updateProfile({
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phone: personalInfo.phone
      })
      setNotification({ type: 'success', message: 'Personal information updated successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update personal information' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDisplaySettings = async () => {
    try {
      setIsSaving(true)
      await updatePreferences('display', displaySettings)
      setNotification({ type: 'success', message: 'Display settings updated successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update display settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveExportSettings = async () => {
    try {
      setIsSaving(true)
      await updatePreferences('export', exportSettings)
      setNotification({ type: 'success', message: 'Export settings updated successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update export settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePrivacySettings = async () => {
    try {
      setIsSaving(true)
      await updatePreferences('analytics', privacySettings)
      setNotification({ type: 'success', message: 'Privacy settings updated successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update privacy settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshProfile()
      setNotification({ type: 'success', message: 'Profile refreshed successfully' })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to refresh profile' })
    }
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <SharedNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <SharedNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SharedNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile & Preferences</h1>
              <p className="text-gray-600 mt-2">
                Manage your personal information, display settings, and privacy preferences
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Profile Overview */}
        {profile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{profile.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Member Since</Label>
                  <p className="text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Timezone</Label>
                  <p className="text-sm">{profile.timezone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Display
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSavePersonalInfo} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings Tab */}
          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                  Customize how Steward looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={displaySettings.theme}
                      onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={displaySettings.currency}
                      onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={displaySettings.dateFormat}
                      onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, dateFormat: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select
                      value={displaySettings.timeFormat}
                      onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, timeFormat: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compactMode">Compact Mode</Label>
                    <p className="text-sm text-gray-500">Use a more condensed layout</p>
                  </div>
                  <Switch
                    id="compactMode"
                    checked={displaySettings.compactMode}
                    onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, compactMode: checked }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveDisplaySettings} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Settings Tab */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
                <CardDescription>
                  Configure default export preferences for receipts and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="exportFormat">Default Format</Label>
                    <Select
                      value={exportSettings.format}
                      onValueChange={(value) => setExportSettings(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateRange">Default Date Range</Label>
                    <Select
                      value={exportSettings.dateRange}
                      onValueChange={(value) => setExportSettings(prev => ({ ...prev, dateRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="includeAnalytics">Include Analytics by Default</Label>
                    <p className="text-sm text-gray-500">Automatically include analytics data in exports</p>
                  </div>
                  <Switch
                    id="includeAnalytics"
                    checked={exportSettings.includeAnalytics}
                    onCheckedChange={(checked) => setExportSettings(prev => ({ ...prev, includeAnalytics: checked }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveExportSettings} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data Settings</CardTitle>
                <CardDescription>
                  Control how your data is used and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowDataAnalytics">Allow Data Analytics</Label>
                      <p className="text-sm text-gray-500">
                        Help improve Steward by allowing anonymous usage analytics
                      </p>
                    </div>
                    <Switch
                      id="allowDataAnalytics"
                      checked={privacySettings.allowDataAnalytics}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowDataAnalytics: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shareUsageData">Share Usage Data</Label>
                      <p className="text-sm text-gray-500">
                        Share anonymous usage patterns to help improve the service
                      </p>
                    </div>
                    <Switch
                      id="shareUsageData"
                      checked={privacySettings.shareUsageData}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, shareUsageData: checked }))}
                    />
                  </div>
                </div>
                <Separator />
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Data Retention</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Your receipt data is retained for {profile?.dataRetentionDays || 2555} days (7 years).
                  </p>
                  <p className="text-sm text-gray-600">
                    You can request data deletion at any time by contacting support.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSavePrivacySettings} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Notification Toast */}
        {notification && (
          <NotificationToast
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  )
} 