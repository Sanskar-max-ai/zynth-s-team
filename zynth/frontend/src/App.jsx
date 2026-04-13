import React, { useState } from 'react'
import CommandCenter from './components/CommandCenter'
import LandingPage from './components/LandingPage'

function App() {
  const [currentView, setCurrentView] = useState('landing')

  return (
    <div className="bg-background min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage onLaunch={() => setCurrentView('app')} />
      ) : (
        <CommandCenter />
      )}
    </div>
  )
}

export default App
