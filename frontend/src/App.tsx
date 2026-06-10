import './App.css'
import { Component } from './components/ui/awwwards-page'
import { ErrorBoundary } from './components/ui/error-boundary'

function App() {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
}

export default App
