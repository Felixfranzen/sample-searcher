import React from 'react'
import ReactDOM from 'react-dom/client'

interface Directory {
  id: number
  path: string
  analyzedFiles?: number
  totalFiles?: number
}

function App() {
  const [directories, setDirectories] = React.useState<Directory[]>([])
  const [nextId, setNextId] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<any[]>([])

  React.useEffect(() => {
    // Listen for progress updates
    window.api.onAnalysisProgress((progress: { directory: { id: number, path: string }, analyzedFiles: number, totalFiles: number }) => {
      setDirectories(prevDirectories =>
        prevDirectories.map(dir =>
          dir.id === progress.directory.id
            ? { ...dir, analyzedFiles: progress.analyzedFiles, totalFiles: progress.totalFiles }
            : dir
        )
      )
    })
  }, [])

  const handleAddDirectory = async () => {
    const path = await window.api.openSelectFileDialog()
    if (path) {
      const newDirectory: Directory = {
        id: nextId,
        path: path
      }
      setDirectories(prev => [...prev, newDirectory])
      setNextId(prev => prev + 1)
      console.log('Added directory:', path)

      // Start analysis immediately
      await window.api.startAnalysis(path)
    }
  }

  const handleDeleteDirectory = (id: number) => {
    setDirectories(prev => prev.filter(dir => dir.id !== id))
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    console.log('Searching for:', searchQuery)
    const results = await window.api.search(searchQuery, 10)
    setSearchResults(results)
    console.log('Search results:', results)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <div style={{
        width: '350px',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Directories</h2>
        <button
          onClick={handleAddDirectory}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}
        >
          + Add Directory
        </button>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {directories.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>
              No directories added yet
            </p>
          ) : (
            directories.map(dir => (
              <div
                key={dir.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '10px', overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      wordBreak: 'break-all',
                      marginBottom: '8px'
                    }}>
                      {dir.path}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {dir.totalFiles !== undefined ? (
                        dir.analyzedFiles === dir.totalFiles ? (
                          `${dir.totalFiles} files`
                        ) : (
                          <>
                            {dir.analyzedFiles} / {dir.totalFiles} files
                            {' '}({dir.totalFiles > 0 ? Math.round((dir.analyzedFiles! / dir.totalFiles) * 100) : 0}%)
                          </>
                        )
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>Scanning...</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDirectory(dir.id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    Delete
                  </button>
                </div>

                {dir.totalFiles !== undefined && dir.analyzedFiles !== dir.totalFiles && (
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginTop: '10px'
                  }}>
                    <div style={{
                      width: `${dir.totalFiles > 0 ? (dir.analyzedFiles! / dir.totalFiles) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#4CAF50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h1 style={{ marginTop: 0 }}>Sample Searcher</h1>

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
                opacity: searchQuery.trim() ? 1 : 0.5,
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
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
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
