import { useState } from 'react'
import FileUpload from './components/FileUpload'
import PolicyViewer from './components/PolicyViewer'
import AnalysisPanel from './components/AnalysisPanel'
import { analyzeWithLLM } from './utils/llmAnalyzer'
import { filterMisconfigs } from './utils/misconfigFilter'
import './styles/App.css'

function App() {
  const [fileContent, setFileContent] = useState(null)
  const [fileType, setFileType] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [filteredIssues, setFilteredIssues] = useState([])

  const handleFileLoad = (content, type) => {
    setFileContent(content)
    setFileType(type)
    setAnalysisResult(null)
    
    // 1차 필터링 (정규식 기반)
    const issues = filterMisconfigs(content, type)
    setFilteredIssues(issues)
  }

  const handleAnalyze = async () => {
    if (!fileContent) return
    
    setIsAnalyzing(true)
    try {
      const result = await analyzeWithLLM(fileContent, fileType, filteredIssues)
      setAnalysisResult(result)
    } catch (error) {
      console.error('분석 오류:', error)
      alert('분석 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setFileContent(null)
    setFileType(null)
    setAnalysisResult(null)
    setFilteredIssues([])
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>☁️ Cloud Misconfig Checker</h1>
        <p>클라우드 설정 오류 자동 분석 도구</p>
      </header>

      <div className="app-container">
        <div className="upload-section">
          <FileUpload onFileLoad={handleFileLoad} onReset={handleReset} />
        </div>

        {fileContent && (
          <div className="main-content">
            <div className="left-panel">
              <PolicyViewer content={fileContent} fileType={fileType} />
            </div>
            <div className="right-panel">
              <AnalysisPanel
                filteredIssues={filteredIssues}
                analysisResult={analysisResult}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
                fileContent={fileContent}
                fileType={fileType}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

