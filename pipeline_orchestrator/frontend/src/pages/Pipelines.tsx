import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pipelinesAPI } from '../services/api'
import { Plus, Play, Pause, Trash2, Search, RefreshCw } from 'lucide-react'

export default function Pipelines() {
  const [pipelines, setPipelines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const response = await pipelinesAPI.list()
      setPipelines(response.data || [])
    } catch (error) {
      console.error('Failed to fetch pipelines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async (id: string) => {
    try {
      await pipelinesAPI.trigger(id)
      alert('Pipeline triggered successfully!')
      fetchPipelines()
    } catch (error) {
      alert('Failed to trigger pipeline')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pipeline?')) return
    
    try {
      await pipelinesAPI.delete(id)
      fetchPipelines()
    } catch (error) {
      alert('Failed to delete pipeline')
    }
  }

  const filteredPipelines = pipelines.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipelines</h1>
          <p className="text-gray-600 mt-1">Manage your data pipelines</p>
        </div>
        <Link to="/pipelines/new" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Pipeline
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pipelines..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={fetchPipelines} className="btn-secondary flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Pipelines List */}
      <div className="card">
        {filteredPipelines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No pipelines found</p>
            {pipelines.length === 0 && (
              <Link to="/pipelines/new" className="btn-primary mt-4 inline-flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Pipeline
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Destination</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mode</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Schedule</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPipelines.map((pipeline) => (
                  <tr key={pipeline.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        to={`/pipelines/${pipeline.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {pipeline.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{pipeline.source_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{pipeline.destination_type}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info">{pipeline.mode}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {pipeline.schedule || 'Manual'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        pipeline.status === 'active' ? 'badge-success' :
                        pipeline.status === 'failed' ? 'badge-error' :
                        pipeline.status === 'running' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {pipeline.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTrigger(pipeline.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Run Now"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pipeline.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


