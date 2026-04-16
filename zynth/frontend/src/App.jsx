import React, { useState, useEffect } from 'react'
import CommandCenter from './components/CommandCenter'
import LandingPage from './components/LandingPage'
import Auth from './components/Auth'

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const [token, setToken] = useState(localStorage.getItem('zynth_token'))

  useEffect(() => {
    if (token) {
      localStorage.setItem('zynth_token', token)
      if (currentView === 'auth') setCurrentView('app')
    } else {
      localStorage.removeItem('zynth_token')
    }
  }, [token])

  const handleAuthSuccess = (newToken) => {
    setToken(newToken)
    setCurrentView('app')
  }

  const handleLogout = () => {
    setToken(null)
    setCurrentView('landing')
  }

  return (
    <div className="bg-background min-h-screen">
      {currentView === 'landing' && (
        <LandingPage onLaunch={(view) => {
          if (view === 'docs') {
            setCurrentView(token ? 'app' : 'auth');
            // We'll use a small timeout to let the app load before switching to docs tab
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('zynth-nav', { detail: 'docs' }));
            }, 100);
          } else {
            setCurrentView(token ? 'app' : 'auth');
          }
        }} />
      )}
      
      {currentView === 'auth' && (
        <Auth 
          onAuthSuccess={handleAuthSuccess} 
          onBack={() => setCurrentView('landing')} 
        />
      )}

      {currentView === 'app' && (
        <CommandCenter onLogout={handleLogout} token={token} />
      )}
    </div>
  )
}

export default App
