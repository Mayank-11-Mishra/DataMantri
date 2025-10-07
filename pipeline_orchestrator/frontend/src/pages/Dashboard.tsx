import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pipelinesAPI } from '../services/api'
import { Activity, Database, CheckCircle, XCircle, Clock, Plus } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    success: 0,
    failed: 0,
  })
  const [recentPipelines, setRecentPipelines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await pipelinesAPI.list()
      const pipelines = response.data || []
      
      setStats({
        total: pipelines.length,
        active: pipelines.filter((p: any) => p.status === 'active').length,
        success: 0, // Would need to query runs
        failed: 0,
      })
      
      setRecentPipelines(pipelines.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your data pipelines</p>
        </div>
        <Link to="/pipelines/new" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Pipeline
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pipelines</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Database className="h-12 w-12 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <Activity className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.success}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Pipelines */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Pipelines</h2>
          <Link to="/pipelines" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>

        {recentPipelines.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pipelines yet</p>
            <Link to="/pipelines/new" className="btn-primary mt-4 inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Pipeline
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPipelines.map((pipeline) => (
              <Link
                key={pipeline.id}
                to={`/pipelines/${pipeline.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{pipeline.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {pipeline.source_type} → {pipeline.destination_type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`badge ${
                      pipeline.status === 'active' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {pipeline.status}
                    </span>
                    <span className={`badge badge-info`}>
                      {pipeline.mode}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


