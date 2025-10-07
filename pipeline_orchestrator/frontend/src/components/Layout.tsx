import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Database, LayoutDashboard, GitBranch, LogOut, User } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Pipeline Orchestrator
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/dashboard"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive('/dashboard')
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
            <Link
              to="/pipelines"
              className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive('/pipelines') || location.pathname.startsWith('/pipelines')
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              <GitBranch className="h-5 w-5 mr-2" />
              Pipelines
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}


