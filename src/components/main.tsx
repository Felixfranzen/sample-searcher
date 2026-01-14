import React from 'react'
import ReactDOM from 'react-dom/client'

interface Directory {
  id: number
  path: string
  analyzedFiles?: number
  totalFiles?: number
}

const monoFont = "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', monospace"

// Add custom checkbox styles
const checkboxStyles = `
  .custom-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background-color: #1a1a1a;
    border: 1px solid #444;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;
  }

  .custom-checkbox:checked {
    background-color: #888;
    border-color: #888;
  }

  .custom-checkbox:checked::before {
    content: '';
    position: absolute;
    left: 3px;
    top: 0px;
    width: 4px;
    height: 8px;
    border: solid #0a0a0a;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`

function App() {
  const [directories, setDirectories] = React.useState<Directory[]>([])
  const [nextId, setNextId] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null)

  React.useEffect(() => {
    // Inject checkbox styles
    const styleElement = document.createElement('style')
    styleElement.textContent = checkboxStyles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedFiles(new Set())
        setLastSelectedIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  React.useEffect(() => {
    // Load existing directories on mount
    const loadDirectories = async () => {
      const existingDirectories = await window.api.getDirectories()
      setDirectories(existingDirectories)
      if (existingDirectories.length > 0) {
        const maxId = Math.max(...existingDirectories.map(d => d.id))
        setNextId(maxId + 1)
      }
    }
    loadDirectories()

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
    if (path && path.length > 0) {
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
    console.log('handle delte')
    window.api.deleteDirectory(id)
    setDirectories(prev => prev.filter(dir => dir.id !== id))
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    console.log('Searching for:', searchQuery)
    const results = await window.api.search(searchQuery, 50)
    setSearchResults(results)
    setSelectedFiles(new Set()) // Clear selection on new search
    setLastSelectedIndex(null)
    console.log('Search results:', results)
  }

  const handleRowClick = (filePath: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const newSelection = new Set(selectedFiles)

      if (newSelection.has(filePath)) {
        // Shift+Click on selected row: remove only this specific row
        newSelection.delete(filePath)
      } else {
        // Shift+Click on unselected row: select range
        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)
        for (let i = start; i <= end; i++) {
          newSelection.add(searchResults[i].filePath)
        }
      }
      setSelectedFiles(newSelection)
    } else {
      // Regular click: select only this file
      setSelectedFiles(new Set([filePath]))
      setLastSelectedIndex(index)
    }
  }

  const handleCheckboxClick = (filePath: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click on checkbox: select/deselect range
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const newSelection = new Set(selectedFiles)
      const shouldSelect = !selectedFiles.has(filePath)
      for (let i = start; i <= end; i++) {
        if (shouldSelect) {
          newSelection.add(searchResults[i].filePath)
        } else {
          newSelection.delete(searchResults[i].filePath)
        }
      }
      setSelectedFiles(newSelection)
    } else {
      // Regular checkbox click: toggle file in selection set
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(filePath)) {
          newSet.delete(filePath)
        } else {
          newSet.add(filePath)
        }
        return newSet
      })
      setLastSelectedIndex(index)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui', backgroundColor: '#0a0a0a', color: '#fff' }}>
      {/* Sidebar */}
      <div style={{
        width: '320px',
        backgroundColor: '#111',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            color: '#666'
          }}>Directories</span>
          <button
            onClick={handleAddDirectory}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '3px',
              fontWeight: '500'
            }}
          >
            + Add
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {directories.length === 0 ? (
            <p style={{ color: '#444', textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
              No directories
            </p>
          ) : (
            directories.map(dir => (
              <div
                key={dir.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '6px',
                  padding: '14px',
                  marginBottom: '10px',
                  border: '1px solid #222'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '10px', overflow: 'hidden' }}>
                    {(() => {
                      const parts = dir.path.split('/');
                      const folderName = parts.pop() || '';
                      const parentPath = parts.join('/');
                      return (
                        <>
                          {parentPath && (
                            <div style={{
                              fontSize: '10px',
                              fontFamily: monoFont,
                              color: '#444',
                              marginBottom: '3px',
                              wordBreak: 'break-all',
                              lineHeight: '1.3'
                            }}>
                              {parentPath}/
                            </div>
                          )}
                          <div style={{
                            fontSize: '13px',
                            fontFamily: monoFont,
                            wordBreak: 'break-all',
                            color: '#ccc',
                            lineHeight: '1.4'
                          }}>
                            {folderName}
                          </div>
                        </>
                      );
                    })()}
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '6px', fontFamily: monoFont }}>
                      {dir.totalFiles !== undefined ? (
                        dir.analyzedFiles === dir.totalFiles ? (
                          `${dir.totalFiles} files`
                        ) : (
                          `${dir.analyzedFiles}/${dir.totalFiles}`
                        )
                      ) : (
                        'scanning...'
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDirectory(dir.id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      color: '#555',
                      border: '1px solid #333',
                      borderRadius: '3px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = '#555';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#555';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    ×
                  </button>
                </div>

                {dir.totalFiles !== undefined && dir.analyzedFiles !== dir.totalFiles && (
                  <div style={{
                    width: '100%',
                    height: '3px',
                    backgroundColor: '#222',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '10px'
                  }}>
                    <div style={{
                      width: `${dir.totalFiles > 0 ? (dir.analyzedFiles! / dir.totalFiles) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#fff',
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
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <h1 style={{ marginTop: 0, fontSize: '20px', fontWeight: '500', letterSpacing: '-0.5px' }}>Sample Searcher</h1>

        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search samples..."
              style={{
                padding: '10px 14px',
                fontSize: '14px',
                flex: 1,
                border: '1px solid #333',
                borderRadius: '4px',
                backgroundColor: '#111',
                color: '#fff',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
                opacity: searchQuery.trim() ? 1 : 0.3,
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500'
              }}
            >
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {searchResults.length} results
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '500', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File</th>
                    <th style={{ padding: '8px 0', width: '80px', fontSize: '11px', fontWeight: '500', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Distance</th>
                    <th style={{ padding: '8px 0', width: '40px', fontSize: '11px', fontWeight: '500', color: '#555', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result, index) => {
                    const parts = result.filePath.split('/');
                    const fileName = parts.pop() || result.filePath;
                    const parentPath = parts.join('/');
                    const isSelected = selectedFiles.has(result.filePath);
                    return (
                      <tr
                        key={index}
                        draggable
                        onClick={(e) => handleRowClick(result.filePath, index, e)}
                        style={{
                          borderBottom: '1px solid #1a1a1a',
                          // cursor: 'grab',
                          backgroundColor: isSelected ? '#2a2a2a' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                        onDragStart={(event) => {
                          event.preventDefault();
                          // If dragging a selected file, drag all selected files
                          // Otherwise, drag just this file
                          const filesToDrag = isSelected && selectedFiles.size > 0
                            ? Array.from(selectedFiles)
                            : [result.filePath];
                          console.log('Drag start:', filesToDrag);
                          window.api.startDragFile(filesToDrag);
                        }}>
                        <td style={{ padding: '12px 12px' }}>
                          {parentPath && (
                            <div style={{
                              fontFamily: monoFont,
                              fontSize: '10px',
                              color: isSelected ? '#888' : '#444',
                              marginBottom: '2px'
                            }}>
                              {parentPath}/
                            </div>
                          )}
                          <div style={{
                            fontFamily: monoFont,
                            fontSize: '13px',
                            color: isSelected ? '#ddd' : '#ccc'
                          }}>
                            {fileName}
                          </div>
                        </td>
                        <td style={{ padding: '12px 0', fontFamily: monoFont, fontSize: '12px', color: isSelected ? '#888' : '#555', textAlign: 'right' }}>
                          {typeof result.distance === 'number' ? result.distance.toFixed(3) : result.distance}
                        </td>
                        <td style={{ padding: '12px 0', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxClick(result.filePath, index, e as any)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
