# DataMantri Mobile App

A beautiful, modern React Native mobile application for viewing dashboards and interacting with AI-powered data insights.

## 🚀 Features

### 📊 Dashboard Viewing
- **Interactive Charts**: Line charts, bar charts, pie charts, and KPI displays
- **Real-time Data**: Live data updates with pull-to-refresh functionality
- **Responsive Design**: Optimized for all screen sizes and orientations
- **Offline Support**: View cached dashboards when offline

### 🤖 AI-Powered Chatbot
- **Natural Language Queries**: Ask questions in plain English
- **Data Insights**: Get intelligent analysis and recommendations
- **Smart Responses**: Context-aware answers with actionable insights
- **Business Intelligence**: Sales trends, customer analytics, regional performance

### 🎨 Modern UI/UX
- **Beautiful Design**: Clean, modern interface with smooth animations
- **Dark/Light Themes**: Automatic theme switching based on system preferences
- **Intuitive Navigation**: Bottom tab navigation with easy access to all features
- **Accessibility**: Full accessibility support for all users

### 🔐 Authentication & Security
- **Secure Login**: Email/password authentication with demo mode
- **Session Management**: Persistent login with automatic token refresh
- **User Profiles**: Comprehensive user management and settings

## 📱 Screenshots

### Dashboard List
- View all available dashboards
- Quick access to dashboard details
- Public/private dashboard indicators
- Last updated timestamps

### Dashboard View
- Interactive charts and visualizations
- KPI cards with trend indicators
- Pull-to-refresh functionality
- Share and export options

### AI Chatbot
- Natural language data queries
- Intelligent insights and recommendations
- Context-aware responses
- Business intelligence features

### Profile & Settings
- User profile management
- App preferences and settings
- Theme customization
- Notification controls

## 🛠️ Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **Charts**: React Native Chart Kit
- **UI Components**: Custom components with React Native Elements
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence
- **Animations**: React Native Reanimated & Animatable
- **Chat**: React Native Gifted Chat
- **Styling**: StyleSheet with dynamic theming

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/sunnyagarwal89/DataMantri_Prod.git
   cd DataMantri_Prod/DataMantriMobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔧 Configuration

### Backend API
Update the API endpoints in `src/contexts/AuthContext.tsx`:
```typescript
const API_BASE_URL = 'http://your-backend-url:5000';
```

### Environment Variables
Create a `.env` file in the root directory:
```env
API_BASE_URL=http://localhost:5000
EXPO_PUBLIC_API_URL=http://localhost:5000
```

## 📱 App Structure

```
src/
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── screens/            # App screens
│   ├── LoginScreen.tsx
│   ├── DashboardListScreen.tsx
│   ├── DashboardViewScreen.tsx
│   ├── ChatbotScreen.tsx
│   ├── ProfileScreen.tsx
│   └── LoadingScreen.tsx
├── components/         # Reusable components
├── utils/             # Utility functions
└── types/             # TypeScript type definitions
```

## 🎯 Key Features Explained

### Dashboard Viewing
- **Chart Types**: Supports line, bar, pie, and KPI charts
- **Data Sources**: Connects to your DataMantri backend API
- **Interactivity**: Tap charts for detailed views
- **Responsive**: Adapts to different screen sizes

### AI Chatbot Capabilities
The chatbot can answer questions like:
- "What are the top 5 selling products this month?"
- "Show me sales trends for the last quarter"
- "Which region has the highest revenue?"
- "Compare this month's performance with last month"
- "How many new customers did we acquire?"

### Smart Insights
The AI provides:
- **Data Analysis**: Automatic pattern recognition
- **Trend Identification**: Spotting growth and decline patterns
- **Recommendations**: Actionable business insights
- **Comparisons**: Period-over-period analysis

## 🔐 Authentication Flow

1. **Login Screen**: Email/password or demo login
2. **Session Management**: Automatic token refresh
3. **Protected Routes**: Secure access to dashboard features
4. **Logout**: Secure session termination

## 🎨 Theming System

- **Dynamic Themes**: Light and dark mode support
- **System Integration**: Follows device theme preferences
- **Customizable**: Easy to modify colors and styles
- **Consistent**: Unified design language across all screens

## 📊 Data Integration

### API Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/demo-login` - Demo user login
- `GET /api/dashboards` - Fetch user dashboards
- `GET /api/dashboards/:id` - Get dashboard details
- `GET /api/dashboards/:id/data` - Get dashboard data

### Data Format
```typescript
interface Dashboard {
  id: string;
  name: string;
  description: string;
  charts: Chart[];
  lastUpdated: string;
  isPublic: boolean;
}
```

## 🚀 Deployment

### iOS App Store
1. Build the app: `expo build:ios`
2. Submit to App Store Connect
3. Configure app metadata and screenshots

### Google Play Store
1. Build the app: `expo build:android`
2. Upload to Google Play Console
3. Configure store listing and release

### Web Deployment
1. Build for web: `expo build:web`
2. Deploy to hosting service (Vercel, Netlify, etc.)

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run e2e
```

### Manual Testing Checklist
- [ ] Login/logout functionality
- [ ] Dashboard loading and display
- [ ] Chart interactions
- [ ] Chatbot responses
- [ ] Theme switching
- [ ] Offline functionality
- [ ] Push notifications

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS simulator not starting**
   ```bash
   npx expo run:ios
   ```

3. **Android build errors**
   ```bash
   cd android && ./gradlew clean
   ```

4. **Chart rendering issues**
   - Ensure react-native-svg is properly linked
   - Check chart data format

## 📈 Performance Optimization

- **Lazy Loading**: Screens load only when needed
- **Image Optimization**: Compressed images and lazy loading
- **Memory Management**: Proper cleanup of resources
- **Bundle Size**: Optimized dependencies and code splitting

## 🔒 Security Features

- **Secure Storage**: Encrypted local storage
- **API Security**: HTTPS communication
- **Authentication**: JWT token-based auth
- **Data Privacy**: No sensitive data stored locally

## 🌟 Future Enhancements

- [ ] Push notifications for data alerts
- [ ] Offline data synchronization
- [ ] Advanced chart interactions
- [ ] Voice commands for chatbot
- [ ] Biometric authentication
- [ ] Multi-language support
- [ ] Widget support for home screen
- [ ] Apple Watch companion app

## 📞 Support

For support and questions:
- **Email**: support@datamantri.com
- **Documentation**: [docs.datamantri.com](https://docs.datamantri.com)
- **Issues**: [GitHub Issues](https://github.com/sunnyagarwal89/DataMantri_Prod/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**DataMantri Mobile** - Your data, your insights, anywhere, anytime. 📱✨
