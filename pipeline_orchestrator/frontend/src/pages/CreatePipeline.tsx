import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { pipelinesAPI } from '../services/api'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CreatePipeline() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'bigquery',
    source_config: {
      project_id: '',
      dataset: '',
      table: '',
      query: '',
    },
    destination_type: 'postgresql',
    destination_config: {
      host: '',
      port: '5432',
      database: '',
      username: '',
      password: '',
      table: '',
    },
    mode: 'batch',
    schedule: '0 2 * * *',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await pipelinesAPI.create(formData)
      alert('Pipeline created successfully!')
      navigate(`/pipelines/${response.data.id}`)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create pipeline')
    } finally {
      setLoading(false)
    }
  }

  const updateSourceConfig = (key: string, value: string) => {
    setFormData({
      ...formData,
      source_config: { ...formData.source_config, [key]: value }
    })
  }

  const updateDestConfig = (key: string, value: string) => {
    setFormData({
      ...formData,
      destination_config: { ...formData.destination_config, [key]: value }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/pipelines" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Pipeline</h1>
          <p className="text-gray-600 mt-1">Configure a new data pipeline</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pipeline Name *
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Sales Data Sync"
              />
            </div>
          </div>
        </div>

        {/* Source Configuration */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Source: BigQuery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project ID *
              </label>
              <input
                type="text"
                className="input"
                value={formData.source_config.project_id}
                onChange={(e) => updateSourceConfig('project_id', e.target.value)}
                required
                placeholder="my-gcp-project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset *
              </label>
              <input
                type="text"
                className="input"
                value={formData.source_config.dataset}
                onChange={(e) => updateSourceConfig('dataset', e.target.value)}
                required
                placeholder="my_dataset"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table *
              </label>
              <input
                type="text"
                className="input"
                value={formData.source_config.table}
                onChange={(e) => updateSourceConfig('table', e.target.value)}
                required
                placeholder="my_table"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Query (Optional)
              </label>
              <input
                type="text"
                className="input"
                value={formData.source_config.query}
                onChange={(e) => updateSourceConfig('query', e.target.value)}
                placeholder="SELECT * FROM table WHERE..."
              />
            </div>
          </div>
        </div>

        {/* Destination Configuration */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Destination: PostgreSQL</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host *
              </label>
              <input
                type="text"
                className="input"
                value={formData.destination_config.host}
                onChange={(e) => updateDestConfig('host', e.target.value)}
                required
                placeholder="localhost"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port *
              </label>
              <input
                type="text"
                className="input"
                value={formData.destination_config.port}
                onChange={(e) => updateDestConfig('port', e.target.value)}
                required
                placeholder="5432"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Database *
              </label>
              <input
                type="text"
                className="input"
                value={formData.destination_config.database}
                onChange={(e) => updateDestConfig('database', e.target.value)}
                required
                placeholder="warehouse"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                className="input"
                value={formData.destination_config.username}
                onChange={(e) => updateDestConfig('username', e.target.value)}
                required
                placeholder="postgres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                className="input"
                value={formData.destination_config.password}
                onChange={(e) => updateDestConfig('password', e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table *
              </label>
              <input
                type="text"
                className="input"
                value={formData.destination_config.table}
                onChange={(e) => updateDestConfig('table', e.target.value)}
                required
                placeholder="target_table"
              />
            </div>
          </div>
        </div>

        {/* Pipeline Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode *
              </label>
              <select
                className="input"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                required
              >
                <option value="batch">Batch</option>
                <option value="realtime">Real-time (Streaming)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule (Cron Expression)
              </label>
              <input
                type="text"
                className="input"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="0 2 * * * (Daily at 2 AM)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for manual execution only. Examples: 0 2 * * * (daily at 2 AM), 0 */6 * * * (every 6 hours)
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link to="/pipelines" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary flex items-center" disabled={loading}>
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Creating...' : 'Create Pipeline'}
          </button>
        </div>
      </form>
    </div>
  )
}


