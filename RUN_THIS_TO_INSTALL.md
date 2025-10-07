# ⚡ Run These Commands to Install PostgreSQL

## 🚨 IMPORTANT: You need to run these commands yourself (they require your password)

---

## 📋 Copy and paste these commands one by one:

### **Step 1: Install Homebrew**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Note:** You'll be asked for your password. This is normal.

After installation completes, if you're on Apple Silicon (M1/M2), run:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

---

### **Step 2: Install PostgreSQL**

```bash
brew install postgresql@15
```

---

### **Step 3: Start PostgreSQL**

```bash
brew services start postgresql@15
```

Wait 5 seconds, then verify:
```bash
pg_isready
```

Should show: "accepting connections"

---

### **Step 4: Create Database**

```bash
psql postgres -c "CREATE DATABASE datamantri;"
```

---

### **Step 5: Install Python Dependencies**

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
source venv/bin/activate
pip install -r requirements.txt
```

---

### **Step 6: Initialize Database Tables**

```bash
python database/init_postgres.py
```

When prompted, type: **yes**

---

## ✅ **After Installation:**

### **Start the application:**

```bash
# Terminal 1: Start backend
python app_simple.py

# Terminal 2: Start frontend
npm run dev
```

### **Visit:**
```
http://localhost:8080
```

### **Login with:**
```
Email: demo@datamantri.com
Password: demo123
```

---

## 🎯 **Quick Copy-Paste (All at Once):**

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (if Apple Silicon M1/M2)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install and start PostgreSQL
brew install postgresql@15
brew services start postgresql@15
sleep 5

# Create database
psql postgres -c "CREATE DATABASE datamantri;"

# Setup DataMantri
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
source venv/bin/activate
pip install -r requirements.txt
echo "yes" | python database/init_postgres.py

# Done! Now start the app:
python app_simple.py
```

---

## 🆘 **If You Get Errors:**

### **"brew: command not found" after installing:**
```bash
# For Apple Silicon (M1/M2)
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Mac
eval "$(/usr/local/bin/brew shellenv)"
```

### **"psql: command not found":**
```bash
brew services start postgresql@15
sleep 5
```

### **"permission denied":**
You need administrator access. Check with your IT department.

---

## ✨ **Expected Result:**

After running all commands, you should see:

```
✅ DATABASE INITIALIZED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   • Users: 2
   • Data Sources: 3
   • Data Marts: 2
   • Pipelines: 2
   • Dashboards: 1

🔐 Login Credentials:
   • Demo: demo@datamantri.com / demo123
   • Admin: admin@datamantri.com / admin123

🌐 Start the application:
   python app_simple.py
```

---

## 📞 **Need Help?**

Check the detailed guide: `INSTALL_POSTGRESQL_MACOS.md`

