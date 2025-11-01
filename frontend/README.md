# 🎨 DataMantri Frontend

Modern React + TypeScript dashboard builder application with AI-powered analytics.

---

## 🚀 Quick Start

### **Prerequisites:**
- Node.js 18+ and npm
- Backend API running on `http://localhost:5001`

### **Installation:**
```bash
npm install
```

### **Development:**
```bash
npm run dev
```
Frontend will start on **http://localhost:8082**

### **Build for Production:**
```bash
npm run build
```

### **Preview Production Build:**
```bash
npm run preview
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── charts/          # Chart components (KPI, Line, Bar, AI Insights, etc.)
│   │   ├── data-sources/    # Data source connection forms
│   │   ├── database/        # Database management components
│   │   ├── layout/          # Layout components (Sidebar, Topbar, etc.)
│   │   └── views/           # View components
│   │
│   ├── pages/               # Page components
│   │   ├── AIDashboardBuilder.tsx
│   │   ├── DashboardBuilder.tsx
│   │   ├── ThemesAndCharts.tsx
│   │   ├── CodeImporter.tsx
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   └── dataFetcher.ts
│   │
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── public/                  # Static assets
├── dist/                    # Production build output
│
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
└── README.md                # This file
```

---

## 🛠️ Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn-ui
- **Charts:** Recharts + D3.js
- **Routing:** React Router
- **State Management:** React Hooks
- **Forms:** React Hook Form

---

## 🔧 Configuration

### **API URL Configuration**

The frontend connects to the backend via Vite proxy (configured in `vite.config.ts`):

```typescript
server: {
  host: "localhost",
  port: 8082,
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: false,
      secure: false,
    }
  }
}
```

### **Environment Variables**

Create a `.env.local` file (optional):
```
VITE_API_URL=http://localhost:5001
```

---

## 📦 Key Features

### **1. AI Dashboard Builder**
- Generate dashboards using natural language
- Powered by Claude AI / OpenAI
- Automatic chart type selection
- AI-generated insights

### **2. Visual Dashboard Builder**
- Drag-and-drop interface
- Pre-built layouts (2x2, 3x3, etc.)
- 10+ chart types
- Real-time preview

### **3. Data Management**
- Connect multiple data sources
- PostgreSQL, MySQL, SQL Server support
- Create data marts
- Data profiling

### **4. Custom Components**
- **Charts:** KPI, Line, Bar, Pie, Area, Table, Heatmap, Column
- **AI Insights:** Smart analytics with positive/negative indicators
- **Themes:** Professional, Modern, Colorful templates
- **Layouts:** Flexible grid system

---

## 🎨 Styling Guide

### **Theme System**
Located in `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      // Custom color palette
    }
  }
}
```

### **Component Styling**
- Uses Tailwind CSS utility classes
- shadcn-ui for base components
- Responsive design (mobile-first)

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🔗 API Integration

All API calls go through the `/api` proxy:

```typescript
// Example API call
const response = await fetch('/api/dashboards', {
  method: 'GET',
  credentials: 'include'
});
```

### **Key Endpoints:**
- `GET /api/session` - Check authentication
- `GET /api/dashboards` - List dashboards
- `POST /api/generate-dashboard` - AI dashboard generation
- `GET /api/data-sources` - List data sources
- `POST /api/run-query` - Execute SQL query

---

## 🚢 Deployment

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

### **Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8082
CMD ["npm", "run", "preview"]
```

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
lsof -ti:8082 | xargs kill -9
npm run dev
```

### **API Connection Failed**
- Ensure backend is running on port 5001
- Check CORS settings in backend
- Clear browser cache

### **Build Errors**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Documentation

- [Main Project README](../README.md)
- [Backend README](../backend/README.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

Proprietary - DataMantri

---

## 🆘 Support

For issues or questions:
- Email: support@datamantri.com
- Docs: [Documentation](../docs/)

---

**Built with ❤️ by the DataMantri Team**

