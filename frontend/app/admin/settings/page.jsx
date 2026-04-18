"use client"

import { useState } from "react"
import { useAuth } from "/lib/auth-context"
import { useData } from "/lib/data-store"
import { DashboardHeader } from "/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/components/ui/card"
import { Badge } from "/components/ui/badge"
import { Button } from "/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/components/ui/table"
import { Label } from "/components/ui/label"
import { Input } from "/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/components/ui/select"
import { Switch } from "/components/ui/switch"
import { Settings, Users, Zap, Save, Shield, Lock, Globe, Building2, Bell, Sparkles } from "lucide-react"
import { cn, getInitials } from "/lib/utils"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user } = useAuth()
  const { settings, updateSettings, users, departments } = useData()
  const [localSettings, setLocalSettings] = useState(settings)
  const [activeTab, setActiveTab] = useState("general")

  const handleSave = () => {
    updateSettings(localSettings)
    toast.success("Settings Updated", {
      description: "Platform configuration has been synchronized successfully."
    })
  }

  const getRoleBadgeStyle = (role) => {
    const r = (role || "").toLowerCase()
    if (r === 'admin') return "bg-orange-100 text-orange-600 border-orange-200"
    if (r === 'hr') return "bg-blue-100 text-blue-600 border-blue-200"
    if (r === 'manager') return "bg-emerald-100 text-emerald-600 border-emerald-200"
    return "bg-slate-100 text-slate-600 border-slate-200"
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen">
      <DashboardHeader title="System Settings" description="Configure organizational parameters and user permissions." />

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings <span className="text-primary">.</span></h1>
                <p className="text-sm font-medium text-slate-400">Configure organizational parameters and global platform settings.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <Button
                    onClick={handleSave}
                    className="bg-slate-950 hover:bg-primary text-white h-14 px-10 rounded-2xl font-bold text-[11px] tracking-widest uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 w-full md:w-auto"
                >
                    <Save className="h-5 w-5" />
                    Apply Changes
                </Button>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border text-slate-500 border-slate-200 p-1 rounded-2xl h-14 w-fit shadow-sm">
            <TabsTrigger value="general" className="px-8 font-bold text-xs rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase tracking-widest">
              <Settings className="h-4 w-4 mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-8 font-bold text-xs rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase tracking-widest">
              <Bell className="h-4 w-4 mr-2" /> Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Information</CardTitle>
                  <CardDescription>Update your organization's primary details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Company Name</Label>
                    <Input
                      value={localSettings.companyName}
                      onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                      className="rounded-xl bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Industry Sector</Label>
                    <Input
                      value="Assurance"
                      readOnly
                      className="rounded-xl bg-slate-50/50 border-slate-200 text-slate-500 font-bold opacity-70 cursor-not-allowed uppercase tracking-widest"
                    />
                  </div>
                </CardContent>
              </Card>

                {user?.role === 'hr' && (
                  <Card className="border-slate-200 shadow-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">AI & Recommendations</CardTitle>
                      <CardDescription>Configure the smart engine parameters.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Auto-Recommendations</Label>
                          <p className="text-xs text-slate-500">Suggest programs based on skill gaps automatically.</p>
                        </div>
                        <Switch
                          checked={localSettings.autoRecommendations}
                          onCheckedChange={(checked) => setLocalSettings({ ...localSettings, autoRecommendations: checked })}
                        />
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Evaluation Frequency</Label>
                        <Select
                          value={localSettings.evaluationFrequency}
                          onValueChange={(val) => setLocalSettings({ ...localSettings, evaluationFrequency: val })}
                        >
                          <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          </TabsContent>



          <TabsContent value="notifications" className="space-y-6 outline-none">
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden max-w-2xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg">Communication Preferences</CardTitle>
                <CardDescription>Manage how the system interacts with users.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Email Notifications</Label>
                    <p className="text-xs text-slate-500">Send program invites and approval alerts via email.</p>
                  </div>
                  <Switch
                    checked={localSettings.notificationsEnabled}
                    onCheckedChange={(checked) => setLocalSettings({ ...localSettings, notificationsEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">In-App Alerts</Label>
                    <p className="text-xs text-slate-500">Display real-time updates in the notification bell.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Digest Frequency</Label>
                    <p className="text-xs text-slate-500">Summary of activity recommendations.</p>
                  </div>
                  <Badge variant="secondary" className="font-bold tracking-widest text-[10px] uppercase">Daily</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Total Users</p>
              <h4 className="text-xl font-bold text-slate-900">{users.length} Active Accounts</h4>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Divisions</p>
              <h4 className="text-xl font-bold text-slate-900">{departments.length} Business Units</h4>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">AI Status</p>
              <h4 className="text-xl font-bold text-slate-900">Optimization Operational</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
