import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { pipelinesAPI } from '../services/api'
import { ArrowLeft, Play, Trash2, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export default function PipelineDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pipeline, setPipeline] = useState<any>(null)
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchPipeline()
      fetchRuns()
    }
  }, [id])

  const fetchPipeline = async () => {
    try {
      const response = await pipelinesAPI.get(id!)
      setPipeline(response.data)
    } catch (error) {
      console.error('Failed to fetch pipeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRuns = async () => {
    try {
      const response = await pipelinesAPI.getRuns(id!)
      setRuns(response.data || [])
    } catch (error) {
      console.error('Failed to fetch runs:', error)
    }
  }

  const handleTrigger = async () => {
    try {
      await pipelinesAPI.trigger(id!)
      alert('Pipeline triggered successfully!')
      setTimeout(() => {
        fetchPipeline()
        fetchRuns()
      }, 1000)
    } catch (error) {
      alert('Failed to trigger pipeline')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pipeline?')) return
    
    try {
      await pipelinesAPI.delete(id!)
      navigate('/pipelines')
    } catch (error) {
      alert('Failed to delete pipeline')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!pipeline) {
    return <div className="text-center py-12">Pipeline not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/pipelines" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pipeline.name}</h1>
            <p className="text-gray-600 mt-1">
              {pipeline.source_type} → {pipeline.destination_type}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleTrigger} className="btn-primary flex items-center">
            <Play className="h-5 w-5 mr-2" />
            Run Now
          </button>
          <button onClick={handleDelete} className="btn-secondary flex items-center text-red-600">
            <Trash2 className="h-5 w-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Pipeline Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <span className={`badge ${
              pipeline.status === 'active' ? 'badge-success' :
              pipeline.status === 'failed' ? 'badge-error' :
              pipeline.status === 'running' ? 'badge-info' :
              'badge-warning'
            }`}>
              {pipeline.status}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">Mode</span>
          </div>
          <span className="badge badge-info">{pipeline.mode}</span>
        </div>

        <div className="card">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">Schedule</span>
          </div>
          <p className="text-sm text-gray-900 font-mono">
            {pipeline.schedule || 'Manual only'}
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Source (BigQuery)</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Project:</dt>
                <dd className="text-gray-900 font-mono">{pipeline.source_config.project_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Dataset:</dt>
                <dd className="text-gray-900 font-mono">{pipeline.source_config.dataset}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Table:</dt>
                <dd className="text-gray-900 font-mono">{pipeline.source_config.table}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Destination (PostgreSQL)</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Host:</dt>
                <dd className="text-gray-900 font-mono">{pipeline.destination_config.host}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Database:</dt>
                <dd className="text-gray-900 font-mono">{pipeline.destination_config.database}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Table:</dt>
                <dd className="text-gray-900 font-mono">{pipeline.destination_config.table}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Execution History</h2>
          <button onClick={fetchRuns} className="text-primary-600 hover:text-primary-700">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No executions yet</p>
            <button onClick={handleTrigger} className="btn-primary mt-4 inline-flex items-center">
              <Play className="h-4 w-4 mr-2" />
              Run First Execution
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      {run.status === 'success' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : run.status === 'failed' ? (
                        <XCircle className="h-6 w-6 text-red-500" />
                      ) : run.status === 'running' ? (
                        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {run.status === 'success' ? 'Completed' :
                         run.status === 'failed' ? 'Failed' :
                         run.status === 'running' ? 'Running' :
                         'Pending'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Started: {format(new Date(run.start_time), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                      {run.end_time && (
                        <p className="text-sm text-gray-600">
                          Ended: {format(new Date(run.end_time), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${
                    run.status === 'success' ? 'badge-success' :
                    run.status === 'failed' ? 'badge-error' :
                    run.status === 'running' ? 'badge-info' :
                    'badge-warning'
                  }`}>
                    {run.status}
                  </span>
                </div>
                {run.log && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {run.log}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


