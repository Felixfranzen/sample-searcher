import { useState, useEffect } from "react";

export const PathInput = () => {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [completedFiles, setCompletedFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    const cleanup = window.api.onAnalysisProgress((filePath) => {
      setCurrentFile(filePath)
      setCompletedFiles(prev => {
        const newSet = new Set(prev)
        if (currentFile) {
          newSet.add(currentFile)
        }
        return newSet
      })
    })
    return cleanup
  }, [currentFile])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const paths = await window.api.openSelectFileDialog()
      setSelectedPaths(paths)
    } catch (e) {
      console.error('Error selecting files:', e)
    }
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (selectedPaths.length === 0) return

    setIsAnalyzing(true)
    setCurrentFile(null)
    setCompletedFiles(new Set())
    try {
      await window.api.startAnalysis(selectedPaths)
    } catch (e) {
      console.error('Error during analysis:', e)
    } finally {
      setIsAnalyzing(false)
      setCurrentFile(null)
    }
  }

  return (
    <div className="path-input-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '100%'
    }}>
      <button 
        onClick={handleClick}
        className="submit-button"
      >
        Select files
      </button>
      {selectedPaths.length > 0 && (
        <>
          <table className="selected-paths-table" style={{
            borderCollapse: 'collapse',
            marginTop: '1rem',
            border: '1px solid #ddd',
            minWidth: '300px',
            maxWidth: '80%'
          }}>
            <tbody>
              {selectedPaths.map((path, index) => (
                <tr key={index}>
                  <td style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    textAlign: 'left',
                    backgroundColor: currentFile === path 
                      ? '#e6f3ff' 
                      : completedFiles.has(path)
                        ? '#e6ffe6'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {currentFile === path && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        minWidth: '12px',
                        minHeight: '12px',
                        border: '2px solid #0066cc',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        flexShrink: 0
                      }} />
                    )}
                    {completedFiles.has(path) && (
                      <span style={{ color: '#00cc00' }}>✓</span>
                    )}
                    {path}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
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
    </div>
  )
} 