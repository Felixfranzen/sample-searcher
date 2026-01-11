import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [selectedPath, setSelectedPath] = React.useState<string>('')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [analysisProgress, setAnalysisProgress] = React.useState<{
    analyzedFiles: number
    totalFiles: number
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)

  React.useEffect(() => {
    // Listen for progress updates
    window.api.onAnalysisProgress((progress: { analyzedFiles: number, totalFiles: number }) => {
      setAnalysisProgress(progress)
    })
  }, [])

  const handleSelectDirectory = async () => {
    const path = await window.api.openSelectFileDialog()
    setSelectedPath(path)
    console.log('Selected directory:', path)
  }

  const handleStartAnalysis = async () => {
    if (!selectedPath) return
    console.log('Starting analysis for:', selectedPath)
    setIsAnalyzing(true)
    setAnalysisProgress({ analyzedFiles: 0, totalFiles: 0 })

    try {
      await window.api.startAnalysis(selectedPath)
    } finally {
      setIsAnalyzing(false)
      // Clear progress after a short delay
      setTimeout(() => setAnalysisProgress(null), 2000)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    console.log('Searching for:', searchQuery)
    const results = await window.api.search(searchQuery, 10)
    setSearchResults(results)
    console.log('Search results:', results)
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
        disabled={!selectedPath || isAnalyzing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: (selectedPath && !isAnalyzing) ? 'pointer' : 'not-allowed',
          marginTop: '10px',
          opacity: (selectedPath && !isAnalyzing) ? 1 : 0.5
        }}
      >
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>

      {analysisProgress && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Progress: {analysisProgress.analyzedFiles} / {analysisProgress.totalFiles}</strong>
            {' '}({analysisProgress.totalFiles > 0 ? Math.round((analysisProgress.analyzedFiles / analysisProgress.totalFiles) * 100) : 0}%)
          </div>
          <div style={{
            width: '100%',
            height: '30px',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${analysisProgress.totalFiles > 0 ? (analysisProgress.analyzedFiles / analysisProgress.totalFiles) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {analysisProgress.totalFiles > 0 ? Math.round((analysisProgress.analyzedFiles / analysisProgress.totalFiles) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h2>Search</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter search query..."
            style={{
              padding: '10px',
              fontSize: '16px',
              flex: 1,
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
              opacity: searchQuery.trim() ? 1 : 0.5
            }}
          >
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Results:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>File Path</th>
                  <th style={{ padding: '10px', width: '120px' }}>Distance</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '14px' }}>
                      {result.filePath}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {result.distance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
