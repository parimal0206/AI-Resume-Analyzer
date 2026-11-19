import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Briefcase, Target, TrendingUp,
  FolderOpen, User, Settings, LogOut, Menu, X, ChevronDown, Shield
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { Button } from './ui/Button'
import { cn } from '../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Resume', href: '/upload', icon: FileText },
  { name: 'Job Board', href: '/jobs', icon: Briefcase },
  { name: 'JD Matcher', href: '/match', icon: Target },
  { name: 'Skill Gap', href: '/skill-gap', icon: TrendingUp },
  { name: 'Applications', href: '/applications', icon: FolderOpen },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <span className="text-xl font-bold">AI Resume Analyzer</span>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-background border-r min-h-screen">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold">AI Resume Analyzer</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </a>
            )
          })}
          {user?.is_admin && (
            <a
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
              Admin Panel
            </a>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={() => {
              document.documentElement.classList.toggle('dark')
              localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
            }}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.full_name || 'User'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg py-1 z-50">
                    <a href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted" onClick={() => setUserMenuOpen(false)}>
                      <User className="h-4 w-4" />
                      Profile
                    </a>
                    <a href="/profile?tab=security" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted" onClick={() => setUserMenuOpen(false)}>
                      <Shield className="h-4 w-4" />
                      Security
                    </a>
                    <hr className="my-1" />
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Need to import useState
import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'