import './App.css'
import { Component } from './components/ui/horizon-hero-section'
import { ErrorBoundary } from './components/ui/error-boundary'

function App() {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
}

export default App
