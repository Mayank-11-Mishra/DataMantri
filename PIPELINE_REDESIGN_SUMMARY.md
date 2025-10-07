# Pipeline Management Redesign - Airflow-Style

## 🎯 Goal
Create an Airflow-like data pipeline orchestration system that allows users to:
- Move data from one table to another
- Transfer data between different data sources  
- Apply SQL transformations during transfer
- Schedule pipeline executions
- Monitor pipeline runs and history

## ✨ New Features

### 1. **Visual DAG-like Interface**
- Beautiful data flow visualization
- Source → Destination with transformation indicator
- Color-coded source (blue) and destination (green) cards

### 2. **Table Selection from Schema**
- Dropdown lists actual tables from connected data sources
- No manual table name entry
- Real-time table fetching from schema API

### 3. **Pipeline Run History**
- Dedicated "Run History" tab with all executions
- Status indicators (Success/Failed/Running)
- Rows processed count
- Start/completion timestamps
- Error messages for failed runs

### 4. **SQL Transformation Support**
- Optional transformation step between source and destination
- Full SQL support with {{source_table}} placeholder
- Useful for filtering, aggregating, or transforming data on-the-fly

### 5. **Enhanced Scheduling**
- Schedule presets (Hourly, Daily, Weekly, etc.)
- Custom cron expression support
- Visual schedule indicator

### 6. **Pipeline Detail View**
- Overview with success/failure statistics
- Visual pipeline flow diagram
- Run history with execution logs
- Configuration details

### 7. **Better UI/UX**
- Gradient-based design matching Data Sources/Marts
- Stats cards showing active/running/failed counts
- Search functionality
- Clickable pipeline cards

## 🔧 Backend APIs Required

The frontend expects these endpoints:
- `GET /api/pipelines` - List all pipelines
- `POST /api/pipelines` - Create new pipeline
- `GET /api/pipelines/:id` - Get pipeline details
- `DELETE /api/pipelines/:id` - Delete pipeline
- `POST /api/pipelines/:id/trigger` - Manually trigger execution
- `GET /api/pipelines/:id/runs` - Get execution history
- `GET /api/data-sources/:id/tables` - Get tables for table selection

## 📊 Data Models

### Pipeline
```
{
  id, name, description,
  source_id, source_table,
  destination_id, destination_table,
  transformation_sql (optional),
  mode (batch/incremental),
  schedule (cron),
  status (active/running/failed/paused),
  total_runs, success_runs, failed_runs,
  created_at, last_run_at
}
```

### Pipeline Run
```
{
  id, pipeline_id,
  status (running/completed/failed),
  started_at, completed_at,
  rows_processed,
  error_message
}
```

## 🎨 Color Scheme
- **Blue/Cyan**: Source data source
- **Green/Emerald**: Destination data source  
- **Purple/Pink**: Transformations
- **Indigo**: Overall pipeline theme
