# 🔔 Alert Management and Notification System

## Overview

DataMantri now includes a comprehensive Alert Management and Notification System that monitors data sources, pipelines, queries, dashboards, and SLA compliance. The system sends multi-channel notifications when alert conditions are met.

---

## ✨ Features

### 🎯 Alert Types
1. **Data Source Connectivity Failure** - Monitors database connections
2. **Pipeline Failure** - Tracks ETL/data pipeline execution
3. **Query Slow Execution** - Detects slow-running queries
4. **Dashboard Scheduler Failure** - Monitors dashboard refresh jobs
5. **SLA Breach** - Tracks data freshness and SLA compliance

### 📢 Notification Channels
- ✉️ **Email** (SMTP)
- 💬 **Slack** (Incoming Webhooks)
- 📱 **Microsoft Teams** (Incoming Webhooks)
- 📞 **WhatsApp** (via Twilio)

### 🔄 Background Monitoring
- Automatic alert evaluation every 5 minutes
- Non-blocking background thread
- Comprehensive error handling and logging

---

## 🏗️ Architecture

### Backend Components

#### 1. **Database Models** (`app_simple.py`)
```python
class Alert(db.Model):
    - name, description
    - condition_type, condition_config
    - channels, recipients
    - is_active, last_triggered_at, trigger_count
    
class AlertHistory(db.Model):
    - alert_id, triggered_at
    - condition_met, severity
    - notifications_sent, notification_errors
    - resolved_at, resolution_notes
```

#### 2. **Alert System** (`alert_system.py`)
```python
NotificationService:
    - send_email()
    - send_slack()
    - send_teams()
    - send_whatsapp()

AlertEvaluator:
    - check_datasource_failure()
    - check_pipeline_failure()
    - check_query_slow()
    - check_dashboard_failure()
    - check_sla_breach()
```

#### 3. **API Endpoints** (`app_simple.py`)
```
GET    /api/alerts              - List all alerts
POST   /api/alerts              - Create alert
GET    /api/alerts/<id>         - Get alert details
PUT    /api/alerts/<id>         - Update alert
DELETE /api/alerts/<id>         - Delete alert
POST   /api/alerts/<id>/test    - Send test notification
GET    /api/alerts/history      - Get alert history
```

#### 4. **Background Scheduler** (`app_simple.py`)
- Runs every 5 minutes
- Evaluates all active alerts
- Sends notifications when conditions are met
- Logs all triggers to `AlertHistory`

### Frontend Components

#### 1. **Alert Management Page** (`src/pages/AlertManagement.tsx`)
- Create/Edit/Delete alerts
- View alert list with status
- Test alerts manually
- Toggle active/inactive status
- Search and filter alerts

#### 2. **Navigation** (`src/components/layout/AppSidebar.tsx`)
- "Alert Management" menu item with bell icon

---

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Email (SMTP) Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=alerts@datamantri.com

# Twilio (WhatsApp) Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Slack (Optional - configure in UI)
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Microsoft Teams (Optional - configure in UI)
# TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

### 2. Install Dependencies

```bash
cd "/path/to/DataMantri"
source venv/bin/activate
pip install requests twilio
```

### 3. Start Services

```bash
# Backend
python3 app_simple.py

# Frontend
npm run dev
```

### 4. Database Tables

The system automatically creates these tables on startup:
- `alerts` - Alert configurations
- `alert_history` - Alert trigger history

---

## 📖 Usage Guide

### Creating an Alert

1. **Navigate to Alert Management**
   - Click "Alert Management" in the sidebar
   - Click "Create Alert" button

2. **Basic Information**
   ```
   Alert Name: Production DB Connection Failure
   Description: Monitor production database connectivity
   ```

3. **Select Condition Type**
   - Choose from: Data Source Failure, Pipeline Failure, Query Slow, Dashboard Failure, or SLA Breach

4. **Configure Condition**
   - **For Data Source Failure:**
     - Select data source
     - Set check interval (minutes)
   
   - **For Pipeline Failure:**
     - Select pipeline
     - Set number of runs to check
   
   - **For Query Slow:**
     - Set threshold in seconds
   
   - **For SLA Breach:**
     - Select data source
     - Set expected load time (HH:MM)
     - Set tolerance in minutes

5. **Select Notification Channels**
   - Check: Email, Slack, Teams, and/or WhatsApp

6. **Configure Recipients**
   - **Email:** Add email addresses (press Enter or click Add)
   - **Slack:** Enter webhook URL
   - **Teams:** Enter webhook URL
   - **WhatsApp:** Add phone numbers in E.164 format (+1234567890)

7. **Set Status**
   - Toggle "Active" to start monitoring immediately

8. **Save**
   - Click "Create Alert"

---

## 🔍 Example Alert Configurations

### Example 1: Data Source Connection Monitoring

```json
{
  "name": "Production DB Connection Check",
  "condition_type": "datasource_failure",
  "condition_config": {
    "datasource_id": "abc-123",
    "check_interval_minutes": 5
  },
  "channels": ["email", "slack"],
  "recipients": {
    "email": ["admin@company.com", "devops@company.com"],
    "slack": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  }
}
```

### Example 2: Pipeline Failure Alert

```json
{
  "name": "ETL Pipeline Failure",
  "condition_type": "pipeline_failure",
  "condition_config": {
    "pipeline_id": "xyz-789",
    "check_last_n_runs": 1
  },
  "channels": ["email", "teams", "whatsapp"],
  "recipients": {
    "email": ["data-team@company.com"],
    "teams": "https://outlook.office.com/webhook/...",
    "whatsapp": ["+1234567890", "+0987654321"]
  }
}
```

### Example 3: SLA Breach Monitoring

```json
{
  "name": "Daily Data Load SLA",
  "condition_type": "sla_breach",
  "condition_config": {
    "datasource_id": "def-456",
    "expected_load_time": "09:00",
    "tolerance_minutes": 30
  },
  "channels": ["email"],
  "recipients": {
    "email": ["manager@company.com"]
  }
}
```

---

## 🔧 Advanced Configuration

### Customizing Alert Evaluation Frequency

Edit `app_simple.py`:

```python
def scheduler_loop():
    logger.info("🔔 Alert scheduler started")
    while True:
        try:
            run_alert_evaluation()
        except Exception as e:
            logger.error(f"Alert scheduler error: {e}")
        
        # Run every 5 minutes (300 seconds)
        # Change this value to adjust frequency
        time.sleep(300)  # 5 minutes
```

### Adding Custom Alert Types

1. **Add condition evaluation method** to `AlertEvaluator` in `alert_system.py`:

```python
def check_custom_condition(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Your custom alert logic"""
    # Implement your logic here
    if condition_met:
        return {
            'severity': 'warning',
            'details': {
                'message': 'Custom condition triggered',
                # ... other details
            }
        }
    return None
```

2. **Update `evaluate_alert()` method** in `AlertEvaluator`:

```python
def evaluate_alert(self, alert: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    condition_type = alert.get('condition_type')
    
    # ... existing conditions ...
    
    elif condition_type == 'custom_condition':
        return self.check_custom_condition(condition_config)
```

3. **Add UI option** in `AlertManagement.tsx`:

```tsx
<SelectItem value="custom_condition">
  <div className="flex items-center gap-2">
    <YourIcon className="h-4 w-4" />
    Your Custom Condition
  </div>
</SelectItem>
```

---

## 📊 Monitoring and Debugging

### View Alert History

```bash
# API endpoint
curl -X GET "http://localhost:5001/api/alerts/history" \
  -H "Cookie: session=..." | jq
```

### Check Backend Logs

```bash
# View alert scheduler logs
tail -f backend_output.log | grep -E "(Alert|🔔)"

# View full alert evaluation
tail -f backend_output.log
```

### Test Individual Alert

1. Go to Alert Management UI
2. Find your alert
3. Click the test tube icon (🧪)
4. Check notifications were sent

---

## 🎨 UI Features

### Alert List Table

| Column | Description |
|--------|-------------|
| Alert Name | Name and description |
| Condition Type | Icon and type label |
| Channels | Icons for Email, Slack, Teams, WhatsApp |
| Status | Active/Inactive badge |
| Last Triggered | Timestamp of last trigger |
| Triggers | Total trigger count |
| Actions | Power, Test, Edit, Delete buttons |

### Actions

| Icon | Action | Description |
|------|--------|-------------|
| ⚡ | Toggle | Activate/Deactivate alert |
| 🧪 | Test | Send test notification |
| ✏️ | Edit | Modify alert configuration |
| 🗑️ | Delete | Remove alert |

---

## 🔐 Security Considerations

1. **Credentials Storage**
   - Store SMTP, Twilio credentials in environment variables
   - Never commit credentials to version control
   - Use `.env` files (add to `.gitignore`)

2. **Webhook URLs**
   - Slack/Teams webhook URLs are stored in database
   - Encrypt sensitive data in production
   - Restrict webhook access to trusted IPs

3. **Access Control**
   - Only authenticated users can create/edit alerts
   - Alerts are scoped to organizations
   - Consider admin-only access for sensitive alerts

---

## 🐛 Troubleshooting

### Issue: Email notifications not sending

**Solution:**
```bash
# Check SMTP configuration
echo $SMTP_USERNAME
echo $SMTP_HOST

# For Gmail, enable "Less secure app access" or use App Password
# https://support.google.com/accounts/answer/185833
```

### Issue: WhatsApp notifications failing

**Solution:**
```bash
# Verify Twilio configuration
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_WHATSAPP_FROM

# Phone numbers must be in E.164 format: +1234567890
# Enable WhatsApp in Twilio Console
```

### Issue: Alert scheduler not running

**Solution:**
```bash
# Check backend logs
tail -f backend_output.log | grep "Alert scheduler"

# Should see:
# INFO:__main__:🔔 Alert scheduler started
# INFO:__main__:✅ Alert scheduler thread started

# If missing, restart backend:
python3 app_simple.py
```

### Issue: Alerts not triggering

**Solution:**
```bash
# 1. Verify alert is active
# 2. Check condition configuration
# 3. Test alert manually (🧪 button)
# 4. Review backend logs for errors
tail -f backend_output.log | grep "Alert"
```

---

## 📈 Performance Optimization

### For Large Deployments

1. **Adjust Evaluation Frequency**
   - Reduce from 5 minutes to 10-15 minutes for non-critical alerts
   - Use different frequencies for different alert types

2. **Database Indexing**
   ```sql
   CREATE INDEX idx_alerts_active ON alerts(is_active);
   CREATE INDEX idx_alert_history_alert_id ON alert_history(alert_id);
   CREATE INDEX idx_alert_history_triggered_at ON alert_history(triggered_at);
   ```

3. **Alert History Cleanup**
   - Regularly archive old alert history
   - Keep last 30-90 days for analysis

---

## 🚀 Production Deployment

### Recommended Setup

1. **Use Production WSGI Server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5001 app_simple:app
   ```

2. **Use Task Queue (e.g., Celery)**
   - Move alert evaluation to Celery tasks
   - Better scalability and reliability

3. **Set up Monitoring**
   - Monitor alert scheduler health
   - Track notification delivery rates
   - Set up alerts for the alert system itself!

4. **Configure Logging**
   ```python
   logging.basicConfig(
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
       handlers=[
           logging.FileHandler('alerts.log'),
           logging.StreamHandler()
       ]
   )
   ```

---

## 📚 API Reference

### Create Alert

```bash
curl -X POST "http://localhost:5001/api/alerts" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "name": "Test Alert",
    "condition_type": "datasource_failure",
    "condition_config": {
      "datasource_id": "abc-123",
      "check_interval_minutes": 5
    },
    "channels": ["email"],
    "recipients": {
      "email": ["test@example.com"]
    },
    "is_active": true
  }'
```

### Get Alert Details

```bash
curl -X GET "http://localhost:5001/api/alerts/{alert_id}" \
  -H "Cookie: session=..."
```

### Update Alert

```bash
curl -X PUT "http://localhost:5001/api/alerts/{alert_id}" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"is_active": false}'
```

### Test Alert

```bash
curl -X POST "http://localhost:5001/api/alerts/{alert_id}/test" \
  -H "Cookie: session=..."
```

### Get Alert History

```bash
curl -X GET "http://localhost:5001/api/alerts/history" \
  -H "Cookie: session=..."
```

---

## 🎉 Summary

The Alert Management System provides:

✅ **5 Alert Types** covering all critical monitoring needs
✅ **4 Notification Channels** for flexible alerting
✅ **Background Scheduler** for automatic monitoring
✅ **Modern UI** for easy configuration
✅ **Complete API** for programmatic access
✅ **Production-Ready** with error handling and logging

**Access the system:**
- Navigate to **Alert Management** in the sidebar
- Create your first alert
- Start monitoring!

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs (`backend_output.log`)
3. Test notifications manually
4. Verify configuration and credentials

**Happy Monitoring! 🎯**

