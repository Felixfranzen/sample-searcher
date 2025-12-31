import { useState } from "react";

type SearchResult = {
  filePath: string;
  distance: number;
  similarity: number;
}

export const PathInput = () => {
  const [selectedPath, setSelectedPath] = useState<string>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const path = await window.api.openSelectFileDialog()
      setSelectedPath(path)
      setAnalysisComplete(false)
      setSearchResults([])
    } catch (e) {
      console.error('Error selecting files:', e)
    }
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!selectedPath) return

    setIsAnalyzing(true)
    try {
      await window.api.startAnalysis(selectedPath)
      setAnalysisComplete(true)
    } catch (e) {
      console.error('Error during analysis:', e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await window.api.search(searchQuery, 10)
      setSearchResults(results)
    } catch (e) {
      console.error('Error during search:', e)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="path-input-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleClick}
          className="submit-button"
        >
          Select directory
        </button>
      </div>
      {selectedPath && (
        <>
          <table className="selected-paths-table" style={{
            borderCollapse: 'collapse',
            marginTop: '1rem',
            border: '1px solid #ddd',
            minWidth: '300px',
            maxWidth: '80%'
          }}>
            <tbody>
                <tr>
                  <td style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    textAlign: 'left'
                  }}>
                    {selectedPath}
                  </td>
                </tr>
            </tbody>
          </table>
          <button
            onClick={handleSubmit}
            style={{
              marginTop: '1rem',
              padding: '8px 16px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing ? 0.7 : 1
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </>
      )}

      {analysisComplete && (
        <div style={{
          marginTop: '2rem',
          width: '100%',
          maxWidth: '600px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#155724'
          }}>
            Analysis complete! You can now search your audio files.
          </div>

          <form onSubmit={handleSearch} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe the sound you're looking for..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isSearching || !searchQuery.trim() ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSearching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '16px' }}>
                Search Results ({searchResults.length})
              </h3>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #ddd'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      textAlign: 'left',
                      fontWeight: 'bold'
                    }}>
                      File Path
                    </th>
                    <th style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      width: '100px'
                    }}>
                      Similarity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result, index) => (
                    <tr key={index} style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}>
                        {result.filePath}
                      </td>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: result.similarity > 0.7 ? '#28a745' : result.similarity > 0.5 ? '#ffc107' : '#6c757d'
                      }}>
                        {(result.similarity * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 