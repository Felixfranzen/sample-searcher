import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [selectedPath, setSelectedPath] = React.useState<string>('')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<any[]>([])

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
