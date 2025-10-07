# Pipeline Orchestrator Frontend

Modern React + TypeScript frontend for the DataMantri Pipeline Orchestrator.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at: http://localhost:3000
```

## 📦 Features

- **Dashboard**: Overview with pipeline stats
- **Pipelines Management**: Create, view, edit, delete pipelines
- **Real-time Monitoring**: Track pipeline execution status
- **Execution History**: View logs and run details
- **Authentication**: JWT-based login system

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API calls
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 📁 Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── pages/            # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Pipelines.tsx
│   ├── CreatePipeline.tsx
│   └── PipelineDetail.tsx
├── services/         # API services
│   └── api.ts
├── styles/           # Global styles
│   └── index.css
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## 🔧 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`.

Configure via environment variable:
```bash
# .env
VITE_API_URL=http://localhost:8000
```

## 🔐 Authentication

Default credentials:
- Email: `admin@datamantri.com`
- Password: `admin123`

## 📝 Available Routes

- `/login` - Login page
- `/dashboard` - Dashboard overview
- `/pipelines` - Pipelines list
- `/pipelines/new` - Create new pipeline
- `/pipelines/:id` - Pipeline detail & execution history

## 🎨 Customization

### Tailwind Colors

Edit `tailwind.config.js` to customize the color scheme:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### API Base URL

Change the API URL in `src/services/api.ts` or via `.env` file.

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change port in vite.config.ts
server: {
  port: 3001  // Use different port
}
```

**API connection errors:**
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Verify proxy configuration in vite.config.ts

## 📄 License

Part of the DataMantri Pipeline Orchestrator project.


