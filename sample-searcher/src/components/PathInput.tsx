import { useState } from "react";

export const PathInput = () => {
  const [selectedPath, setSelectedPath] = useState<string>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const path = await window.api.openSelectFileDialog()
      setSelectedPath(path)
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
    } catch (e) {
      console.error('Error during analysis:', e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="path-input-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '100%'
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
    </div>
  )
} 