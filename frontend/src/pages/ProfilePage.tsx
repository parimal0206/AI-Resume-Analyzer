import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Settings, LogOut, Bell, Moon, Sun,
  Download, Trash2, Shield
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CheckCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'data'>('profile')
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [success, setSuccess] = useState('')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'data', label: 'Data', icon: Download },
  ]

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('Profile updated successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('Password changed successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              ← Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">Settings</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-8 border-b">
          <nav className="flex gap-6" aria-label="Settings tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information and account details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                    <Input
                      id="fullName"
                      defaultValue={user?.full_name || ''}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Status</label>
                  <div className="flex items-center gap-3">
                    <Badge variant={user?.is_active ? 'success' : 'destructive'}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary">{user?.is_admin ? 'Admin' : 'User'}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Member since {new Date(user?.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium">Current Password</label>
                    <Input id="currentPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                    <Input id="newPassword" type="password" placeholder="•••••••• (min 8 chars)" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" />
                  </div>
                  <Button type="submit">Update Password</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDarkMode(!darkMode)
                    document.documentElement.classList.toggle('dark')
                    localStorage.setItem('theme', darkMode ? 'light' : 'dark')
                  }}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {darkMode ? 'Light' : 'Dark'}
                </Button>
              </div>

              <div className="border-t pt-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates about job matches and application status</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell className="h-4 w-4" />
                  {notifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>Download a copy of all your data in JSON format.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Export</p>
                  <p className="text-sm text-muted-foreground">Includes resumes, analyses, applications, and preferences</p>
                </div>
                <Button variant="outline" onClick={() => alert('Export functionality would be implemented here')}>
                  <Download className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card className="mt-8 border-gray-200 dark:border-gray-800">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}