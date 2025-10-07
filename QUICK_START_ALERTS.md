# 🚀 Quick Start: Alert Management System

## ⚡ 5-Minute Setup

### 1. **Access the System**

Open your browser and navigate to:
```
http://localhost:8082
```

Login with:
- Email: `demo@datamantri.com`
- Password: `demo123`

### 2. **Navigate to Alert Management**

Click **"Alert Management"** in the left sidebar (Bell icon 🔔)

### 3. **Create Your First Alert**

#### Example: Monitor Database Connection

1. **Click "Create Alert"**

2. **Fill Basic Information:**
   ```
   Alert Name: Production Database Monitor
   Description: Alert when production DB is unreachable
   ```

3. **Select Condition:**
   - Condition Type: **Data Source Connectivity Failure**
   - Data Source: Select from dropdown (e.g., "Oneapp_dev")
   - Check Interval: `5` minutes

4. **Configure Notifications:**
   - ✅ Check **Email**
   - Add Email: `your-email@example.com` → Click "Add"

5. **Keep Active:**
   - ✅ Toggle "Active" ON

6. **Click "Create Alert"**

### 4. **Test the Alert**

1. Find your alert in the table
2. Click the **Test Tube icon (🧪)**
3. Check your email for test notification!

---

## 📧 Email Configuration (Required for Email Alerts)

### For Gmail:

1. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate app password for "DataMantri"

2. **Set Environment Variables:**

**On Mac/Linux:**
```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export SMTP_FROM=your-email@gmail.com
```

**On Windows:**
```cmd
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USERNAME=your-email@gmail.com
set SMTP_PASSWORD=your-app-password
set SMTP_FROM=your-email@gmail.com
```

3. **Restart Backend:**
```bash
# Kill existing
kill -9 $(lsof -ti :5001)

# Start with new env vars
cd "/path/to/DataMantri - Cursor copy 2"
source venv/bin/activate
python3 app_simple.py
```

---

## 💬 Slack Integration (Optional)

### Setup Slack Webhook:

1. **Create Incoming Webhook:**
   - Go to: https://api.slack.com/messaging/webhooks
   - Click "Create your Slack app"
   - Enable "Incoming Webhooks"
   - Add to workspace
   - Copy webhook URL

2. **Configure in DataMantri:**
   - Create/Edit Alert
   - Check **Slack**
   - Paste webhook URL in "Slack Webhook URL" field

3. **Test:**
   - Click Test button (🧪)
   - Check Slack channel!

---

## 📱 Microsoft Teams Integration (Optional)

### Setup Teams Webhook:

1. **Create Incoming Webhook in Teams:**
   - Open Teams channel
   - Click "..." → "Connectors"
   - Find "Incoming Webhook"
   - Configure & copy URL

2. **Configure in DataMantri:**
   - Create/Edit Alert
   - Check **Microsoft Teams**
   - Paste webhook URL

---

## 📞 WhatsApp Integration (Optional)

### Setup Twilio:

1. **Sign up for Twilio:**
   - Visit: https://www.twilio.com/
   - Get Account SID and Auth Token

2. **Enable WhatsApp Sandbox:**
   - Go to Twilio Console → Messaging → Try it Out → WhatsApp
   - Follow instructions to join sandbox

3. **Set Environment Variables:**
```bash
export TWILIO_ACCOUNT_SID=your_account_sid
export TWILIO_AUTH_TOKEN=your_auth_token
export TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

4. **Configure in DataMantri:**
   - Create/Edit Alert
   - Check **WhatsApp**
   - Add phone numbers in format: `+1234567890`

---

## ✅ Pre-configured Alerts Examples

### Alert 1: Data Source Health Check
```
Type: Data Source Connectivity Failure
Data Source: [Select your database]
Check Interval: 5 minutes
Channels: Email
```

### Alert 2: Pipeline Failure Detection
```
Type: Pipeline Failure
Pipeline: [Select a pipeline]
Check Last N Runs: 1
Channels: Email + Slack
```

### Alert 3: SLA Monitoring
```
Type: SLA Breach
Data Source: [Select data source]
Expected Load Time: 09:00
Tolerance: 30 minutes
Channels: Email + Teams
```

---

## 🎯 Alert Actions

| Icon | Action | Description |
|------|--------|-------------|
| ⚡ | Toggle | Turn alert ON/OFF |
| 🧪 | Test | Send test notification |
| ✏️ | Edit | Modify configuration |
| 🗑️ | Delete | Remove alert |

---

## 🔍 How Alerts Work

1. **Background Scheduler** runs every **5 minutes**
2. **Checks all active alerts**
3. **Evaluates conditions** (e.g., can database connect?)
4. **If condition met** → Sends notifications
5. **Logs to history** for auditing

---

## 📊 View Alert History

1. Click on any alert
2. View:
   - Last triggered time
   - Total trigger count
   - Recent history

---

## 🐛 Troubleshooting

### Email not working?
```bash
# Check if SMTP env vars are set
echo $SMTP_USERNAME

# Test manually:
python3 -c "
from alert_system import NotificationService
ns = NotificationService()
result = ns.send_email(['test@example.com'], 'Test', 'Test message')
print(result)
"
```

### Alert not triggering?
1. ✅ Check alert is **Active**
2. ✅ Verify condition configuration
3. ✅ Test manually with 🧪 button
4. ✅ Check backend logs: `tail -f backend_output.log`

### Frontend not loading?
```bash
# Check services
lsof -i :5001  # Backend
lsof -i :8082  # Frontend

# Restart if needed
cd "/path/to/DataMantri - Cursor copy 2"
npm run dev
```

---

## 📈 Next Steps

1. ✅ **Create alerts** for critical systems
2. ✅ **Configure Slack/Teams** for team notifications
3. ✅ **Set up SLA monitoring** for data freshness
4. ✅ **Review alert history** regularly
5. ✅ **Adjust thresholds** based on experience

---

## 🎉 You're All Set!

The Alert Management System is now:
- ✅ **Running** (background scheduler active)
- ✅ **Monitoring** (checks every 5 minutes)
- ✅ **Ready** to send notifications

**Create your first alert and stay informed! 🔔**

---

## 📞 Need Help?

Check:
- 📖 Full documentation: `ALERT_MANAGEMENT_SYSTEM.md`
- 🔍 Backend logs: `backend_output.log`
- 🧪 Test alerts manually
- 🌐 API: `http://localhost:5001/api/alerts`

**Happy Monitoring! 🚀**

