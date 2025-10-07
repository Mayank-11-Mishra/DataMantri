# 📧 Email Setup Guide for DataMantri Scheduler

The scheduler now supports **real email delivery**! Follow this guide to configure email sending.

## Quick Setup (Gmail - Recommended)

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Select "Mail" as the app and "Other" as the device
5. Click "Generate" - you'll get a 16-character password
6. **Copy this password** - you'll need it in Step 2

### Step 2: Set Environment Variables

**Option A: Using Terminal (temporary, for testing)**
```bash
export MAIL_SERVER=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USE_TLS=True
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password-here
export MAIL_DEFAULT_SENDER=your-email@gmail.com
```

**Option B: Create .env file (permanent, recommended)**
```bash
cd /Users/sunny.agarwal/Projects/DataMantri\ -\ Cursor
nano .env
```

Add these lines:
```
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

Save (Ctrl+O, Enter) and exit (Ctrl+X).

### Step 3: Install python-dotenv (if using .env file)
```bash
pip3 install python-dotenv
```

Add this line to the top of `app_simple.py` (after imports):
```python
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
```

### Step 4: Restart Backend
```bash
# Kill existing backend
lsof -ti:5001 | xargs kill -9

# Start backend (it will load .env automatically if python-dotenv is installed)
python3 app_simple.py
```

## Alternative SMTP Providers

### Office 365 / Outlook
```bash
export MAIL_SERVER=smtp.office365.com
export MAIL_PORT=587
export MAIL_USE_TLS=True
export MAIL_USERNAME=your-email@outlook.com
export MAIL_PASSWORD=your-password
```

### Custom SMTP Server
```bash
export MAIL_SERVER=smtp.example.com
export MAIL_PORT=587
export MAIL_USE_TLS=True
export MAIL_USERNAME=your-email@example.com
export MAIL_PASSWORD=your-password
```

## Testing Email Delivery

1. Go to **Scheduler** page in DataMantri
2. Create a new scheduler (or edit existing)
3. Add your email as recipient
4. Click **Test** button
5. Check your email inbox (and spam folder)

## Troubleshooting

### "Email not configured" error
- Make sure environment variables are set
- Restart the backend after setting variables
- Check if `MAIL_USERNAME` and `MAIL_PASSWORD` are not empty

### "Authentication failed" error
- For Gmail: Use App Password, not your regular password
- Verify credentials are correct
- Check if 2-Step Verification is enabled

### "Connection timeout" error
- Check if port 587 is not blocked by firewall
- Try MAIL_PORT=465 with MAIL_USE_TLS=False and MAIL_USE_SSL=True

### Email not received
- Check spam/junk folder
- Verify recipient email is correct
- Check backend logs for errors: `tail -f backend.log`

## Security Best Practices

1. **Never commit** `.env` file to git (it's already in `.gitignore`)
2. Use **App Passwords** instead of account passwords
3. Rotate passwords periodically
4. Use environment variables, not hardcoded credentials
5. Consider using a dedicated email account for automated emails

## Features

- ✅ Beautiful HTML email templates
- ✅ Plain text fallback for email clients
- ✅ Dashboard link in email
- ✅ Custom subject and message
- ✅ Multiple recipients (comma-separated)
- ✅ Test button to verify configuration
- ✅ Error tracking and logging
- 🚧 WhatsApp integration (coming soon)
- 🚧 Slack integration (coming soon)

## Need Help?

If you're still having issues, check the backend logs:
```bash
tail -50 backend.log
```

Or enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

