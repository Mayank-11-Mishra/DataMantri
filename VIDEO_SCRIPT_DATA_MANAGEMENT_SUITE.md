# 🎬 VIDEO SCRIPT: Data Management Suite

**Duration:** 3-4 minutes  
**Style:** Professional, Comprehensive, Feature-rich  
**Music:** Professional corporate background track

---

## 🎯 VIDEO OBJECTIVES
- Showcase the complete data management workflow
- Demonstrate connecting to multiple data sources
- Show data mart creation for unified data views
- Highlight pipeline orchestration capabilities
- Display SQL query builder and execution
- Show performance monitoring features
- Demonstrate visual relationship mapping

---

## 📝 SCENE-BY-SCENE BREAKDOWN

### **SCENE 1: Opening & Introduction** (0:00 - 0:10)
**Duration:** 10 seconds

**Screen:**
- DataMantri main dashboard
- Sidebar with "Data Management Suite" highlighted

**Voiceover:**
> "Welcome to DataMantri's Data Management Suite - your complete platform for data connectivity, transformation, and analysis."

**Actions:**
1. Start with DataMantri logo fade-in
2. Transition to main dashboard
3. Cursor hovers over "Data Management Suite" in sidebar
4. Click and transition to Data Management Suite

**Visual Effects:**
- Professional fade-in
- Highlight menu item with glow
- Smooth page transition

---

### **SCENE 2: Data Management Suite Overview** (0:10 - 0:20)
**Duration:** 10 seconds

**Screen:**
- Data Management Suite landing page
- Six tabs visible: Data Sources, Data Marts, Data Pipelines, SQL, Performance, Visual Tools

**Voiceover:**
> "Six powerful tools in one unified interface. Let's explore each one."

**Actions:**
1. Camera shows the header: "Data Management Suite" with gradient title
2. Pan across all six tabs:
   - 🗄️ Data Sources
   - 📦 Data Marts
   - 🔄 Data Pipelines
   - 💻 SQL
   - 📊 Performance
   - 🔍 Visual
3. Show connection status: "Connected • 3 active sources"

**Visual Effects:**
- Smooth camera pan (left to right)
- Each tab lights up briefly as camera passes
- Subtle pulse on active indicators

---

### **SCENE 3: Data Sources - Overview** (0:20 - 0:35)
**Duration:** 15 seconds

**Screen:**
- Data Sources tab (already selected with blue gradient)
- Four stat cards at top
- Data source cards grid below

**Voiceover:**
> "Start by connecting your data sources. DataMantri supports PostgreSQL, MySQL, MongoDB, and more."

**Actions:**
1. Camera focuses on stat cards:
   - **Total Sources:** 3 (blue gradient)
   - **Active Sources:** 3 (green gradient)
   - **Database Types:** 2 (purple gradient)
   - **Connected Sources:** 100% (emerald gradient)
2. Scroll down to show data source cards:
   - **oneapp:** PostgreSQL 🐘 | 148 tables | Status: Connected ✓ | [Manage] [Edit] [Delete]
   - **Analytics DB:** MySQL 🐬 | 45 tables | Status: Connected ✓
   - **Logs DB:** MongoDB 🍃 | 12 collections | Status: Connected ✓
3. Show hover effect on cards (shadow grows, slight scale)

**Visual Effects:**
- Count-up animation on stat numbers
- Gradient pulse on "Connected" status
- Card hover with shadow and scale

---

### **SCENE 4: Adding a New Data Source** (0:35 - 1:05)
**Duration:** 30 seconds

**Screen:**
- Click "➕ Add Data Source" button
- Connection form appears

**Voiceover:**
> "Adding a new connection is simple. Enter your database credentials, test the connection, and you're ready to go."

**Actions:**
1. Click "Add Data Source" button (gradient blue button)
2. Modal/form slides in from right:
   - **Title:** "Add New Data Source"
   - **Fields visible:**
     - Connection Name: (input)
     - Database Type: (dropdown)
     - Host: (input)
     - Port: (input)
     - Database: (input)
     - Username: (input)
     - Password: (password input with eye icon)
3. Fill in form with typing animation:
   - Name: "Production DB"
   - Type: Select "PostgreSQL" from dropdown
   - Host: "10.19.9.9"
   - Port: "15445"
   - Database: "production"
   - Username: "admin"
   - Password: "••••••••"
4. Click "🔌 Test Connection" button
5. Loading spinner appears
6. Success message: "✅ Connection successful!"
7. "Save" button lights up
8. Click "Save"
9. Success notification: "Data source added successfully!"
10. New card appears in grid with animation

**Visual Effects:**
- Form slide-in from right
- Typing animation for each field
- Dropdown animation
- Loading spinner
- Success checkmark animation with confetti
- New card fade-in and scale-up

---

### **SCENE 5: Managing Data Source - Schema View** (1:05 - 1:25)
**Duration:** 20 seconds

**Screen:**
- Click "Manage" on "oneapp" data source
- Three tabs: Schema, Data Browser, Indexes & Relations

**Voiceover:**
> "Explore your database structure with our intuitive schema browser. View tables, columns, data types, and constraints at a glance."

**Actions:**
1. Click "Manage" button on "oneapp" card
2. Page transitions to schema view
3. Show search bar: "🔍 Search tables..."
4. Type "aggr" - tables filter
5. Show expanded table card: "aggregated_data"
   - **Metadata:** 148,523 rows | 25 columns | 45.2 MB
   - **Columns displayed in grid:**
     - billing_date (DATE, NOT NULL)
     - site_id (INTEGER, PRIMARY KEY)
     - total_sales (DECIMAL, NULL)
     - region (VARCHAR, NULL)
6. Click another table: "aggregated_data_today"
7. Different column structure appears
8. Show color-coded badges:
   - Data types in different colors
   - PRIMARY KEY in gold
   - NULL/NOT NULL badges

**Visual Effects:**
- Search typing animation
- Live filtering with fade
- Card expand animation
- Column grid layout with stagger
- Color-coded badges with gradients

---

### **SCENE 6: Data Browser** (1:25 - 1:40)
**Duration:** 15 seconds

**Screen:**
- Click "Data Browser" tab
- Table selector and data grid

**Voiceover:**
> "Browse your actual data with powerful search and pagination. Perfect for data exploration and validation."

**Actions:**
1. Click "Data Browser" tab (green gradient when active)
2. Select table: "aggregated_data"
3. Data grid appears with:
   - **Header:** Green gradient
   - **Table selector:** Beautiful dropdown with database icon
   - **Search bar:** "🔍 Search data in rows..."
   - **Data table:** Scrollable with columns
4. Type in search: "North"
5. Table filters to show only North region data
6. Show pagination: "Page 1 of 15 • 10 rows per page"
7. Click "Next" to go to page 2
8. New data animates in

**Visual Effects:**
- Tab switch animation
- Table fade-in
- Search typing
- Row highlighting on filter
- Smooth pagination transition

---

### **SCENE 7: Indexes & Relations** (1:40 - 1:55)
**Duration:** 15 seconds

**Screen:**
- Click "Indexes & Relations" tab
- Show indexes and foreign keys

**Voiceover:**
> "Understand your database structure with comprehensive index and relationship views."

**Actions:**
1. Click "Indexes & Relations" tab (purple/indigo when active)
2. Table selector: Choose "aggregated_data"
3. Show two sections:
   
   **Indexes Section (Yellow/Orange):**
   - **Card 1:** idx_billing_date
     - Columns: [billing_date]
     - Type: BTREE | Unique: No
   - **Card 2:** idx_site_id
     - Columns: [site_id]
     - Type: BTREE | Unique: Yes
   
   **Foreign Keys Section (Blue/Cyan):**
   - **Card 1:** fk_site_id
     - From: [site_id] → sites.[id]
     - ON DELETE: CASCADE | ON UPDATE: RESTRICT
4. Show scrolling through multiple indexes
5. Hover over card to see tooltip

**Visual Effects:**
- Tab transition
- Section headers with gradients
- Card grid layout
- Color-coded badges (yellow for indexes, blue for foreign keys)
- Hover tooltips

---

### **SCENE 8: Data Marts - Introduction** (1:55 - 2:10)
**Duration:** 15 seconds

**Screen:**
- Click "Data Marts" tab in header
- Data Marts overview page

**Voiceover:**
> "Create Data Marts to unite multiple tables. Perfect for creating consolidated views of your data across different sources."

**Actions:**
1. Click "📦 Data Marts" tab
2. Show stat cards:
   - **Total Marts:** 2 (green gradient)
   - **With Joins:** 1 (blue gradient)
   - **Data Sources:** 3 (purple gradient)
   - **Recently Updated:** Today (emerald gradient)
3. Show data mart cards with rotating color gradients:
   - **PMI_Digital_sales:** Green gradient | Union of 2 tables | Last updated: 2 hours ago
   - **Customer_Analytics:** Blue gradient | Joined data | Last updated: Today

**Visual Effects:**
- Tab switch
- Stat cards with count-up animation
- Data mart cards with gradient borders
- Hover effects

---

### **SCENE 9: Creating a Data Mart** (2:10 - 2:40)
**Duration:** 30 seconds

**Screen:**
- Click "Create Data Mart"
- Selection between UI Builder and Query Editor

**Voiceover:**
> "Build data marts visually or write custom SQL. Choose the method that works best for you."

**Actions:**
1. Click "➕ Create Data Mart" button
2. Two large option cards appear:
   
   **Option 1: UI Builder (Blue/Cyan theme)**
   - Large icon with hover effect
   - "Visual Interface" badge
   - ✓ Drag & Drop
   - ✓ Visual Joins
   - ✓ No Code Required
   - [Build Visually] button
   
   **Option 2: Query Editor (Green/Emerald theme)**
   - Large icon with hover effect
   - "SQL Power" badge
   - ✓ Full SQL Control
   - ✓ Complex Queries
   - ✓ Advanced Features
   - [Write SQL] button
3. Click "Build Visually"
4. UI Builder interface appears:
   - **Step 1:** Name input: "Sales_Summary"
   - **Step 2:** Data source selector: "oneapp"
   - **Step 3:** Table multi-select:
     - ☑ aggregated_data
     - ☑ aggregated_data_today
     - ☐ other_table
   - **Step 4:** Union/Join selector: Select "Union"
5. Preview shows: "2 tables will be combined"
6. Click "Create Data Mart"
7. Success: "✅ Data Mart created!"

**Visual Effects:**
- Option cards with hover scale
- Form step-by-step reveal
- Checkbox animations
- Preview panel update
- Success animation with confetti

---

### **SCENE 10: Data Pipelines** (2:40 - 3:10)
**Duration:** 30 seconds

**Screen:**
- Click "Data Pipelines" tab
- Pipeline management interface

**Voiceover:**
> "Automate your data workflows with visual pipeline builder. Schedule transformations, monitor runs, and ensure data quality."

**Actions:**
1. Click "🔄 Data Pipelines" tab
2. Show stat cards:
   - **Total:** 3 pipelines
   - **Active:** 2 running
   - **Running:** 0 currently
   - **Failed:** 0 errors
3. Show pipeline cards:
   
   **Pipeline 1: Daily Sales Aggregation**
   - Source: oneapp.raw_sales → Destination: oneapp.aggregated_data
   - Mode: Incremental
   - Schedule: Every 1 hour
   - Last Run: 15 minutes ago (Success ✓)
   - [⏵ Run Now] [✏ Edit] [🗑 Delete]
   
4. Click "Create Pipeline" button
5. Form appears:
   - Name: "Hourly Customer Sync"
   - Source Data Source: [Dropdown]
   - Source Table: [Dropdown]
   - Destination Data Source: [Dropdown]
   - Destination Table: [Dropdown]
   - Transformation SQL: [Monaco Editor]
   - Mode: [Full Refresh / Incremental]
   - Schedule: [Cron expression input]
6. Show typing in transformation SQL:
   ```sql
   SELECT 
     customer_id,
     SUM(total_sales) as lifetime_value,
     COUNT(*) as order_count
   FROM source_table
   GROUP BY customer_id
   ```
7. Click "Create Pipeline"
8. Success notification

**Visual Effects:**
- Tab transition
- Pipeline cards with status indicators (green dot for running)
- Form slide-in
- Monaco editor syntax highlighting
- Success animation

---

### **SCENE 11: SQL Query Builder** (3:10 - 3:35)
**Duration:** 25 seconds

**Screen:**
- Click "SQL" tab
- SQL editor interface

**Voiceover:**
> "Execute SQL queries with our advanced editor. Get autocomplete, syntax highlighting, and instant results."

**Actions:**
1. Click "💻 SQL" tab (orange/amber gradient when active)
2. Show interface:
   - **Database Selector:** Dropdown with data sources AND data marts
     - 🗄️ oneapp (datasource)
     - 📦 PMI_Digital_sales (datamart)
     - 🗄️ Analytics DB (datasource)
   - **Monaco Editor:** Large SQL editor with dark theme
   - **Results Panel:** Below editor
3. Select "PMI_Digital_sales" data mart
4. Type query with autocomplete:
   ```sql
   SELECT 
     region,
     SUM(total_sales) as sales,
     COUNT(*) as orders
   FROM aggregated_data_today
   WHERE billing_date = CURRENT_DATE
   GROUP BY region
   ORDER BY sales DESC
   LIMIT 10
   ```
5. Show autocomplete suggestions appearing:
   - After typing "SEL" → "SELECT" suggestion
   - After typing "FROM " → table name suggestions
   - Column name suggestions
6. Click "▶ Execute Query" button (or Ctrl+Enter)
7. Loading indicator appears
8. Results table animates in:
   - Headers: region | sales | orders
   - 10 rows of data
   - "Showing 10 rows • Executed in 0.34s"
9. Show table is scrollable horizontally and vertically

**Visual Effects:**
- Tab switch animation
- Typing animation with autocomplete popups
- Syntax highlighting (blue keywords, green strings, orange functions)
- Loading spinner
- Results table fade-in with stagger
- Highlight execution time

---

### **SCENE 12: Performance Monitoring** (3:35 - 3:55)
**Duration:** 20 seconds

**Screen:**
- Click "Performance" tab
- Performance dashboard

**Voiceover:**
> "Monitor your database performance in real-time. Track server stats, active processes, and identify slow queries."

**Actions:**
1. Click "📊 Performance" tab (pink/rose gradient when active)
2. Show performance dashboard:
   
   **Section 1: Server Stats (Top)**
   - **Card 1:** CPU Usage
     - Gauge chart: 45%
     - Status: Normal (green)
   - **Card 2:** Memory Usage
     - Gauge chart: 67%
     - Status: Good (green)
   - **Card 3:** Active Connections
     - Number: 24 / 100
     - Status: Healthy
   - **Card 4:** Disk I/O
     - Read: 45 MB/s
     - Write: 12 MB/s
   
   **Section 2: Active Processes (Middle)**
   - Table showing:
     - PID | User | Query | Duration | Status
     - 3 active queries running
     - Color-coded by duration (green < 1s, yellow 1-5s, red > 5s)
   
   **Section 3: Slow Queries (Bottom)**
   - List of queries taking > 5 seconds
   - Query text (truncated)
   - Execution time
   - [Optimize] button for each

3. Show auto-refresh indicator: "Auto-refreshing every 30s"
4. Values update (numbers change slightly)

**Visual Effects:**
- Tab transition
- Gauge charts with animated needles
- Count-up animations for numbers
- Color transitions (green/yellow/red based on thresholds)
- Table rows pulse when updated

---

### **SCENE 13: Visual Tools - ER Diagram** (3:55 - 4:15)
**Duration:** 20 seconds

**Screen:**
- Click "Visual" tab
- ER diagram interface

**Voiceover:**
> "Visualize your database relationships with interactive ER diagrams. Understand table connections, foreign keys, and data flow at a glance."

**Actions:**
1. Click "🔍 Visual" tab (cyan/teal gradient when active)
2. Show ER diagram interface:
   - **Top bar:** 
     - Database selector: "oneapp"
     - Search tables: input field
     - Zoom controls: [−] 100% [+]
     - "Show/Hide Details" toggle
     - [⤓ Export] button (SQL, PNG, PDF options)
   - **Canvas:** Interactive diagram area
3. ER diagram appears:
   - **Table 1: aggregated_data**
     - Box with columns listed
     - Primary key highlighted
   - **Table 2: sites**
     - Box with columns
   - **Table 3: products**
     - Box with columns
   - **Relationships:** Arrows connecting tables
     - aggregated_data.site_id → sites.id (1:N)
     - aggregated_data.product_id → products.id (1:N)
4. Interact with diagram:
   - Click and drag "aggregated_data" table - it moves
   - Hover over relationship arrow - tooltip shows foreign key details
   - Zoom in (150%) - tables get larger
   - Zoom out (75%) - see more tables
5. Search for "sales" - highlights relevant tables
6. Click "Export" → Select "PNG"
7. Success: "Diagram exported!"

**Visual Effects:**
- Tab transition
- Diagram fade-in
- Tables appear with stagger (one by one)
- Relationship arrows animate (draw from source to target)
- Hover glow on tables
- Smooth drag interaction
- Zoom animation (not just instant)
- Search highlight (yellow glow on matching tables)

---

### **SCENE 14: Integration Showcase** (4:15 - 4:30)
**Duration:** 15 seconds

**Screen:**
- Quick montage showing workflow integration

**Voiceover:**
> "It all works together. Connect your sources, build data marts, create pipelines, run queries, monitor performance, and visualize relationships - all in one seamless platform."

**Actions:**
Fast-paced montage (2-3 seconds each):
1. Data source being added (form filling)
2. Schema view exploring tables
3. Data mart creation (UI builder)
4. Pipeline running (success notification)
5. SQL query executing (results appearing)
6. Performance dashboard refreshing
7. ER diagram showing relationships
8. Everything connected with animated arrows

**Visual Effects:**
- Fast cuts with smooth transitions
- Each scene zooms in slightly
- Arrows/lines connecting between scenes
- Final shot: All six tabs visible with checkmarks

---

### **SCENE 15: Closing & Call-to-Action** (4:30 - 4:45)
**Duration:** 15 seconds

**Screen:**
- Pull back to show full Data Management Suite
- Transition to DataMantri logo

**Voiceover:**
> "DataMantri's Data Management Suite - complete control over your data ecosystem. Start managing your data like a pro today."

**Actions:**
1. Camera zooms out from detailed view
2. Show full Data Management Suite with all tabs
3. Quick highlight of each tab (sequential glow)
4. Fade to DataMantri logo
5. Show text:
   - "DataMantri"
   - "Complete Data Management Platform"
   - "datamantri.com"
   - "Start Your Free Trial →"
6. End screen with contact info

**Visual Effects:**
- Smooth zoom-out
- Sequential tab glow (left to right)
- Professional fade to black
- Logo scale-up with glow
- Text types on screen
- Call-to-action button pulse

**Music:**
- Build to final climax
- End with confident chord

---

## 🎨 VISUAL STYLE GUIDE

### **Color Scheme by Feature:**
- **Data Sources:** Blue (#3B82F6) → Indigo (#6366F1)
- **Data Marts:** Green (#10B981) → Emerald (#059669)
- **Pipelines:** Purple (#8B5CF6) → Violet (#7C3AED)
- **SQL:** Orange (#F59E0B) → Amber (#F59E0B)
- **Performance:** Pink (#EC4899) → Rose (#F43F5E)
- **Visual:** Cyan (#06B6D4) → Teal (#14B8A6)

### **UI Elements:**
- **Active Tab:** Bold gradient background, white text, scale 1.05x
- **Stat Cards:** Gradient background, large numbers, icon
- **Data Cards:** White background, shadow, gradient border on hover
- **Buttons:** Gradient backgrounds, white text, scale on hover

---

## 🎤 VOICEOVER NOTES

### **Tone:**
- Professional and authoritative
- Clear and instructional
- Confident but approachable
- Moderate to slightly fast pace

### **Emphasis Keywords:**
- "Complete platform"
- "Real-time"
- "Visual pipeline builder"
- "Advanced editor"
- "All in one"

### **Technical Terms (pronounce clearly):**
- PostgreSQL (post-gres-Q-L)
- MongoDB (mon-go-D-B)
- Schema (skee-ma)
- ER Diagram (E-R diagram)
- Incremental (in-cre-MEN-tal)

---

## 🎵 MUSIC & SOUND

### **Background Music:**
- **Genre:** Corporate/Tech/Professional
- **Mood:** Confident, sophisticated, modern
- **Tempo:** 100-120 BPM
- **Volume:** -18dB to -24dB

### **Sound Effects:**
- **Tab Clicks:** Professional "click"
- **Success Notifications:** Cheerful "ding"
- **Data Loading:** Subtle "processing" sound
- **Card Interactions:** Soft "pop"
- **Transitions:** Smooth "whoosh"

---

## 📊 KEY FEATURES TO EMPHASIZE

### **Connectivity:**
- Multiple database types
- Easy connection testing
- Secure credential storage

### **Exploration:**
- Schema browsing
- Data preview
- Relationship visualization

### **Transformation:**
- Visual data mart builder
- SQL query editor
- Pipeline orchestration

### **Monitoring:**
- Real-time performance metrics
- Active process tracking
- Slow query identification

---

## ✅ PRE-PRODUCTION CHECKLIST

### **Data Preparation:**
- [ ] Set up 3 data sources (PostgreSQL, MySQL, MongoDB)
- [ ] Populate with realistic tables and data
- [ ] Create 2 sample data marts
- [ ] Set up 3 sample pipelines with run history
- [ ] Ensure performance metrics show realistic data

### **UI Preparation:**
- [ ] Clear all test/dummy data
- [ ] Ensure all tabs are functional
- [ ] Test all interactions
- [ ] Verify search and filtering works
- [ ] Check autocomplete in SQL editor

### **Recording Setup:**
- [ ] 1920x1080 resolution
- [ ] 100% zoom level
- [ ] Hide browser chrome (if possible)
- [ ] Disable notifications
- [ ] Clean desktop

---

## 🎬 POST-PRODUCTION

### **Editing:**
- [ ] Trim dead air and mistakes
- [ ] Add transitions between sections
- [ ] Sync voiceover perfectly
- [ ] Add background music
- [ ] Add sound effects
- [ ] Add text overlays for feature names

### **Graphics:**
- [ ] Add lower thirds with section names
- [ ] Add animated arrows/highlights
- [ ] Add feature callouts
- [ ] Add DataMantri logo watermark
- [ ] Add end screen with CTA

### **Final Touches:**
- [ ] Color grade for consistency
- [ ] Audio leveling and EQ
- [ ] Subtitle/caption file (SRT)
- [ ] Multiple resolution exports

---

## 📱 DELIVERY FORMATS

1. **Full Video:** 3-4 minutes, MP4, Full HD (1920x1080)
2. **Feature Clips:** 30-45 seconds each feature, MP4
3. **Social Media Cut:** 60 seconds, MP4, 1080x1080 (square)
4. **GIF Previews:** 10 seconds per feature, < 5MB each
5. **Thumbnail Images:** 1280x720, JPEG, high quality

---

## 📝 SCRIPT VARIATIONS

### **Short Version (90 seconds):**
- Data Sources: Add + Manage (20s)
- Data Marts: Create (15s)
- Pipelines: Overview (15s)
- SQL: Query execution (20s)
- Performance: Dashboard view (10s)
- Visual: ER diagram (10s)

### **Feature-Specific Videos (30-45s each):**
1. Data Sources Deep Dive
2. Data Mart Creation
3. Pipeline Builder
4. SQL Editor Features
5. Performance Monitoring
6. Visual Relationship Mapping

---

**Ready to showcase the complete Data Management Suite! 🎥✨**

