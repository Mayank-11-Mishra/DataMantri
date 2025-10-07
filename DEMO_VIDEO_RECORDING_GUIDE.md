# 📹 DataMantri Demo Video Recording Guide

This guide will help you create professional demo videos for the marketing website from your actual DataMantri product.

## 🎥 Tools You'll Need

### **Recommended Screen Recording Software:**

**For Mac:**
- **QuickTime Player** (Free, built-in)
  - Open QuickTime → File → New Screen Recording
  - Select area and start recording
  
- **Loom** (Free tier available)
  - Best for quick recordings with webcam overlay
  - Auto-uploads to cloud
  - Download: https://www.loom.com

**For Windows:**
- **OBS Studio** (Free, professional)
  - Download: https://obsproject.com
  - Highly customizable
  
- **Loom** (Cross-platform)
  - Same as Mac version

**Professional Tools:**
- **Camtasia** ($299 one-time) - Best for editing
- **ScreenFlow** (Mac, $169) - Professional editing

---

## 📝 Demo Videos to Record

### **1. Data Sources Demo** (30-45 seconds)

**What to Record:**
```
1. Navigate to: http://localhost:8080
2. Login with demo credentials
3. Click "Data Management" in sidebar
4. Click "Data Sources" tab
5. Click "Add Data Source" button
6. Fill in connection form (show PostgreSQL example)
7. Click "Test Connection" → Show success message
8. Click "Save"
9. Click "Manage" on the newly created source
10. Show Schema tab with tables expanding
11. Show Data Browser tab with data loading
12. Show Indexes & Relations tab
```

**Recording Tips:**
- Zoom in to 125% for better visibility
- Use smooth mouse movements
- Pause 2 seconds on important screens
- Keep mouse movements slow and purposeful

---

### **2. Data Marts Demo** (30-45 seconds)

**What to Record:**
```
1. Go to Data Management → Data Marts
2. Click "Create Data Mart"
3. Select "UI Builder" option
4. Enter name: "Sales Dashboard Data"
5. Select data source from dropdown
6. Select tables to include
7. Show the visual builder interface
8. Click "Create" button
9. Show the created data mart in the list
```

---

### **3. Data Pipelines Demo** (45-60 seconds)

**What to Record:**
```
1. Go to Data Management → Pipelines
2. Click "Create Pipeline" button
3. Enter pipeline name: "Sales Data ETL"
4. Select Source: PostgreSQL → sales_raw table
5. Select Destination: MySQL → sales_processed table
6. Add SQL transformation:
   SELECT *, UPPER(customer_name) as customer_name 
   FROM {{source_table}} 
   WHERE status = 'active'
7. Select mode: "Batch"
8. Set schedule: "Daily at 2 AM"
9. Click "Create Pipeline"
10. Show the visual flow diagram
11. Click "Run Now" to trigger pipeline
12. Show run history
```

---

### **4. SQL Editor Demo** (45-60 seconds)

**What to Record:**
```
1. Go to Data Management → SQL Editor
2. Show the beautiful header
3. Select database from dropdown
4. Write a SQL query in the editor:
   SELECT * FROM users WHERE created_at > '2024-01-01' LIMIT 10
5. Click "Execute" button
6. Show results table with data
7. Click "Export" → Select CSV
8. Show "New Tab" button to create another tab
9. Show "Saved Queries" sidebar
10. Click "Save Query" to save current query
```

---

### **5. Performance Monitoring Demo** (30-45 seconds)

**What to Record:**
```
1. Go to Data Management → Performance
2. Show the pink gradient header
3. Enable "Auto-refresh" toggle
4. Show the stats cards updating (CPU, Memory, Disk)
5. Scroll down to show Server Stats
6. Show Active Processes table
7. Show Slow Queries section
8. Click "Refresh Now" button
```

---

### **6. Visual Tools Demo** (30-45 seconds)

**What to Record:**
```
1. Go to Data Management → Visual Tools
2. Show the cyan gradient header
3. Select database from dropdown
4. Show the ER Diagram being generated
5. Zoom in/out using zoom controls
6. Click on a table to show details
7. Show table relationships with arrows
8. Click "Export" → Select PNG
9. Show "Show/Hide Details" toggle
```

---

### **7. Dashboard Creation (AI Prompt Style)** ⚡

**What to Record:**
```
Currently, this feature is in the planning phase.
For the demo video, you can:
1. Screen record the InteractiveDemo component from the website
2. Or create a mockup showing:
   - User typing: "Create sales dashboard with revenue trends"
   - AI processing animation
   - Dashboard being generated with charts
   - Final dashboard preview
```

---

## 🎬 Recording Best Practices

### **Before Recording:**
1. ✅ Clear browser cache
2. ✅ Close unnecessary tabs
3. ✅ Hide bookmarks bar (Cmd+Shift+B / Ctrl+Shift+B)
4. ✅ Use Incognito/Private mode for clean browser
5. ✅ Set browser zoom to 125% for better visibility
6. ✅ Make sure data is populated in your database

### **During Recording:**
1. 🎯 Keep recordings under 1 minute
2. 🐢 Move mouse slowly and purposefully
3. ⏸️ Pause 1-2 seconds on important screens
4. 🎨 Show successful actions (green checkmarks, success messages)
5. 🔄 If you make a mistake, just start over

### **After Recording:**
1. ✂️ Trim the beginning and end
2. 🎵 Consider adding background music (optional)
3. 💾 Export as MP4 (H.264, 1080p)
4. 📦 Optimize file size (keep under 5MB per video)

---

## 📦 Video Specifications

### **Recommended Settings:**
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Format**: MP4 (H.264)
- **Max File Size**: 5MB per video
- **Duration**: 30-60 seconds each

### **Compression Tools:**
- **HandBrake** (Free) - https://handbrake.fr
- **CloudConvert** (Online) - https://cloudconvert.com
- **FFmpeg** (Command line)

---

## 🎨 Editing Tips

### **Free Editing Software:**
- **DaVinci Resolve** (Professional, Free)
- **iMovie** (Mac, Free)
- **Shotcut** (Cross-platform, Free)

### **Quick Edits:**
1. Add text overlays for feature names
2. Add zoom effects on important areas
3. Speed up slow sections (1.5x)
4. Add fade in/fade out transitions
5. Optional: Add subtle background music

---

## 📁 File Organization

Save your videos with clear names:

```
demo-videos/
├── 01-data-sources.mp4
├── 02-data-marts.mp4
├── 03-data-pipelines.mp4
├── 04-sql-editor.mp4
├── 05-performance.mp4
├── 06-visual-tools.mp4
└── 07-dashboard-ai.mp4
```

---

## 🔗 Adding Videos to Website

Once you have the videos, you can replace the animated demos with actual video players:

### **Option 1: Host on YouTube (Recommended)**
1. Upload videos to YouTube (unlisted)
2. Embed using iframe in the website

### **Option 2: Self-host**
1. Place videos in `datamantri-website/public/videos/`
2. Use HTML5 video player in InteractiveDemo component

### **Option 3: Use Video Hosting Service**
- **Vimeo** (Professional, paid)
- **Cloudflare Stream** (Affordable)
- **AWS S3 + CloudFront** (Scalable)

---

## ✅ Quick Checklist

Before publishing:
- [ ] All 7 demo videos recorded
- [ ] Each video under 60 seconds
- [ ] Videos compressed (under 5MB each)
- [ ] Videos show successful workflows
- [ ] No personal/sensitive data visible
- [ ] Audio removed or muted (unless you add voiceover)
- [ ] Videos uploaded to hosting service
- [ ] Website updated with video players

---

## 🎬 Ready to Start?

1. Start your product: `http://localhost:8080`
2. Open your screen recording software
3. Follow the recording guides above
4. Edit and compress your videos
5. Upload and integrate into website

**Need help?** Feel free to ask for specific recording tips or editing guidance!

---

**Happy Recording! 🎥**

