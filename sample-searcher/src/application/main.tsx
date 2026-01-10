import React from 'react'
import ReactDOM from 'react-dom/client'

declare global {
  interface Window {
    api: {
      openSelectFileDialog: () => Promise<string>
      startAnalysis: (filePath: string) => Promise<void>
      search: (query: string, resultsCount?: number) => Promise<any>
    }
  }
}

function App() {
  const [selectedPath, setSelectedPath] = React.useState<string>('')

  const handleSelectDirectory = async () => {
    const path = await window.api.openSelectFileDialog()
    setSelectedPath(path)
    console.log('Selected directory:', path)
  }

  const handleStartAnalysis = async () => {
    if (!selectedPath) return
    console.log('Starting analysis for:', selectedPath)
    await window.api.startAnalysis(selectedPath)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Sample Searcher</h1>
      <button 
        onClick={handleSelectDirectory}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          cursor: 'pointer' 
        }}
      >
        Select Directory
      </button>
      {selectedPath && (
        <p style={{ marginTop: '10px' }}>
          Selected: <strong>{selectedPath}</strong>
        </p>
      )}
      <button 
        onClick={handleStartAnalysis}
        disabled={!selectedPath}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          cursor: selectedPath ? 'pointer' : 'not-allowed',
          marginTop: '10px',
          opacity: selectedPath ? 1 : 0.5
        }}
      >
        Start Analysis
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
