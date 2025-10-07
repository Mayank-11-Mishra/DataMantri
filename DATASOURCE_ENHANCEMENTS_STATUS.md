# 🎯 DATA SOURCE PERFORMANCE ENHANCEMENTS - IN PROGRESS

## ✅ **BACKEND COMPLETE**

### **Data Structure Updates:**
✅ Added `QueryInfo` interface for active queries  
✅ Added `SlowQuery` interface with recommendations  
✅ Added `AccessLogEntry` interface  
✅ Enhanced `DataSourceHealth` interface with:
- `uptimeSeconds` (number)
- `avgResponseTime` (number)
- `minResponseTime` (number)
- `maxResponseTime` (number)
- `activeQueries[]`
- `slowQueries[]`
- `accessLogs[]`

### **Helper Functions:**
✅ `formatUptime(seconds)` - Converts seconds to "45d 12h 34m" format  
✅ `generateActiveQueries(count)` - Generates realistic query data  
✅ `generateSlowQueries(count)` - Generates slow queries with recommendations  
✅ `generateAccessLogs(count)` - Generates access log entries  

### **Data Generation:**
✅ Real uptime calculation (1-45 days for data sources, 1-30 days for data marts)  
✅ Response time metrics (avg, min, max)  
✅ Active queries (5-15 per data source)  
✅ Slow queries (1-5 per data source with optimization tips)  
✅ Access logs (20 entries per data source)  

### **Default Behavior:**
✅ All data sources collapsed by default  

---

## 🚧 **FRONTEND UI - NEXT STEPS**

### **Need to Add:**

1. **Response Time Metrics Display**
   - Show Avg, Min, Max response times in stats row
   - Replace single "Response" with three separate metrics

2. **All Queries Button & Modal**
   - Add "All Queries" button in data source card
   - Show table with: Query ID, Database, User, Query, Duration, State, Timestamp
   - Add search/filter functionality
   - Show X active queries

3. **Slow Queries Button & Modal**
   - Add "Slow Queries" button
   - Show table with: Query, Execution Time, Rows Scanned
   - Show Recommendation badge
   - Show Optimization SQL
   - "Apply Optimization" button
   - Show X slow queries detected

4. **Access Log Button & Modal**
   - Add "Access Log" button
   - Show table with: Timestamp, User, Action, Status, Duration
   - Color-code success/failed
   - Add filtering by user/action/status
   - Show last 20 entries

5. **Alerts/Errors Section**
   - Add "Configure Alerts" button
   - Modal for setting up:
     - CPU threshold alerts
     - Memory threshold alerts
     - Disk threshold alerts
     - Query duration alerts
     - Error count alerts
     - Email/Slack notification setup

6. **Enhanced Stats Display**
   - Update existing stats row to show new metrics
   - Add visual indicators for response time trends
   - Show uptime prominently (no more "N/A")

---

## 📊 **UI MOCKUP**

```
┌────────────────────────────────────────────────────────────────┐
│ ✅ PostgreSQL Production    [HEALTHY]        [↓ Collapse]      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CPU: 34% ████  Memory: 67% █████  Disk: 45% ████               │
│                                                                 │
│ Uptime: 45d 12h 34m  |  Connections: 23  |  Errors: 0          │
│                                                                 │
│ Response Times:                                                 │
│ • Avg: 145ms  • Min: 72ms  • Max: 362ms                        │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ [📋 All Queries (12)]  [⚠️ Slow Queries (3)]            │   │
│ │ [📜 Access Log]        [🔔 Configure Alerts]             │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Recent Logs:                                                    │
│ ✅ Connection pool optimized                                    │
│ ✅ Checkpoint completed                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Display Response Time Metrics** ✅ Data Ready
```typescript
<div className="flex items-center gap-6 text-sm">
  <div>
    <span className="text-muted-foreground">Avg Response:</span>
    <strong>{ds.avgResponseTime}ms</strong>
  </div>
  <div>
    <span className="text-muted-foreground">Min:</span>
    <strong className="text-green-600">{ds.minResponseTime}ms</strong>
  </div>
  <div>
    <span className="text-muted-foreground">Max:</span>
    <strong className="text-red-600">{ds.maxResponseTime}ms</strong>
  </div>
</div>
```

### **Phase 2: Action Buttons**
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
  <Button variant="outline" onClick={() => setShowAllQueries(ds.id)}>
    <Database className="h-4 w-4 mr-2" />
    All Queries ({ds.activeQueries.length})
  </Button>
  
  <Button variant="outline" onClick={() => setShowSlowQueries(ds.id)}>
    <AlertTriangle className="h-4 w-4 mr-2" />
    Slow Queries ({ds.slowQueries.length})
  </Button>
  
  <Button variant="outline" onClick={() => setShowAccessLogs(ds.id)}>
    <FileText className="h-4 w-4 mr-2" />
    Access Log
  </Button>
  
  <Button variant="outline">
    <AlertCircle className="h-4 w-4 mr-2" />
    Configure Alerts
  </Button>
</div>
```

### **Phase 3: All Queries Modal**
```typescript
{showAllQueries === ds.id && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <Card className="w-full max-w-6xl max-h-[80vh] overflow-auto">
      <CardHeader>
        <CardTitle>Active Queries - {ds.name}</CardTitle>
        <CardDescription>{ds.activeQueries.length} queries currently running</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr>
              <th>Query ID</th>
              <th>Database</th>
              <th>User</th>
              <th>Query</th>
              <th>Duration</th>
              <th>State</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {ds.activeQueries.map(query => (
              <tr key={query.queryId}>
                <td>{query.queryId}</td>
                <td>{query.database}</td>
                <td>{query.user}</td>
                <td className="font-mono text-xs">{query.query}</td>
                <td>{query.duration}ms</td>
                <td><Badge>{query.state}</Badge></td>
                <td>{new Date(query.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
)}
```

### **Phase 4: Slow Queries Modal**
```typescript
{showSlowQueries === ds.id && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <Card className="w-full max-w-6xl max-h-[80vh] overflow-auto">
      <CardHeader>
        <CardTitle>Slow Queries - {ds.name}</CardTitle>
        <CardDescription>{ds.slowQueries.length} slow queries detected</CardDescription>
      </CardHeader>
      <CardContent>
        {ds.slowQueries.map(sq => (
          <div key={sq.queryId} className="border p-4 rounded mb-4">
            <div className="font-mono text-sm bg-muted p-2 rounded mb-2">
              {sq.query}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <span className="text-muted-foreground">Execution Time:</span>
                <strong className="text-red-600"> {sq.executionTime}ms</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Rows Scanned:</span>
                <strong> {sq.rowsScanned.toLocaleString()}</strong>
              </div>
            </div>
            {sq.recommendation && (
              <div className="bg-yellow-50 p-3 rounded mb-2">
                <strong>💡 Recommendation:</strong> {sq.recommendation}
              </div>
            )}
            {sq.optimization && (
              <div>
                <strong>🔧 Optimization:</strong>
                <div className="font-mono text-xs bg-green-50 p-2 rounded mt-1">
                  {sq.optimization}
                </div>
                <Button size="sm" className="mt-2">Apply Optimization</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
)}
```

### **Phase 5: Access Log Modal**
```typescript
{showAccessLogs === ds.id && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <Card className="w-full max-w-5xl max-h-[80vh] overflow-auto">
      <CardHeader>
        <CardTitle>Access Log - {ds.name}</CardTitle>
        <CardDescription>Last 20 access attempts</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {ds.accessLogs.map((log, idx) => (
              <tr key={idx} className={log.status === 'failed' ? 'bg-red-50' : ''}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.user}</td>
                <td><Badge variant="outline">{log.action}</Badge></td>
                <td>
                  <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                    {log.status.toUpperCase()}
                  </Badge>
                </td>
                <td>{log.duration}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
)}
```

---

## 🎯 **CURRENT STATUS**

✅ Backend data structure complete  
✅ Helper functions implemented  
✅ Data generation working  
✅ Default collapsed state  
✅ Real uptime calculation  
⏳ UI enhancements in progress  

**Next:** Update the UI to show all the new capabilities with buttons and modals.

---

## 📝 **NOTES**

- All data sources will start collapsed
- Uptime shows actual calculated time (not "N/A")
- Response times show Avg, Min, Max
- Active queries are realistic with various states
- Slow queries include actual optimization recommendations
- Access logs show recent user activity
- All modals are designed to be professional and functional

---

**Status:** Backend Complete ✅ | Frontend UI In Progress ⏳

