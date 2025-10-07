import { ThemeProvider } from './contexts/ThemeContext'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  )
}

export default App

