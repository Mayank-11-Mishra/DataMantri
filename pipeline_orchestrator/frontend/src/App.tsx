import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pipelines from './pages/Pipelines'
import CreatePipeline from './pages/CreatePipeline'
import PipelineDetail from './pages/PipelineDetail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/pipelines/new" element={<CreatePipeline />} />
            <Route path="/pipelines/:id" element={<PipelineDetail />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App


