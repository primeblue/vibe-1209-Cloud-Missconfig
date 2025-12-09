import { useState } from 'react'
import './AnalysisPanel.css'

function AnalysisPanel({ filteredIssues, analysisResult, isAnalyzing, onAnalyze, fileContent, fileType }) {
  const [showPatched, setShowPatched] = useState(false)

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return '#cc0000'
      case 'High': return '#ff4444'
      case 'Medium': return '#ffaa00'
      case 'Low': return '#00aa00'
      default: return '#666'
    }
  }

  const getSeverityColor = (severity) => {
    return getRiskColor(severity || 'Medium')
  }

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h2>🔍 보안 분석</h2>
        <button 
          className="analyze-button" 
          onClick={onAnalyze}
          disabled={isAnalyzing || !fileContent}
        >
          {isAnalyzing ? '분석 중...' : '🤖 LLM 분석 시작'}
        </button>
      </div>

      {/* 1차 필터링 결과 */}
      <div className="filtered-section">
        <h3>⚡ 1차 필터링 결과</h3>
        {filteredIssues.length > 0 ? (
          <>
            <div className="issues-summary">
              <span className="summary-item">
                총 <strong>{filteredIssues.length}</strong>개 발견
              </span>
              <span className="summary-item">
                Critical: <strong style={{ color: getSeverityColor('Critical') }}>
                  {filteredIssues.filter(i => i.severity === 'Critical').length}
                </strong>
              </span>
              <span className="summary-item">
                High: <strong style={{ color: getSeverityColor('High') }}>
                  {filteredIssues.filter(i => i.severity === 'High').length}
                </strong>
              </span>
              <span className="summary-item">
                Medium: <strong style={{ color: getSeverityColor('Medium') }}>
                  {filteredIssues.filter(i => i.severity === 'Medium').length}
                </strong>
              </span>
              <span className="summary-item">
                Low: <strong style={{ color: getSeverityColor('Low') }}>
                  {filteredIssues.filter(i => i.severity === 'Low').length}
                </strong>
              </span>
            </div>
            <div className="issues-list">
              {filteredIssues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className="issue-item"
                  style={{ 
                    borderLeftColor: getSeverityColor(issue.severity),
                    backgroundColor: issue.severity === 'Critical' ? '#ffe6e6' : 
                                    issue.severity === 'High' ? '#fff3cd' : 
                                    issue.severity === 'Medium' ? '#e7f3ff' : '#f0f0f0'
                  }}
                >
                  <div className="issue-header">
                    <span className="issue-type">{issue.type}</span>
                    {issue.severity && (
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                    )}
                  </div>
                  <span className="issue-desc">{issue.description}</span>
                  <span className="issue-location">📍 {issue.location}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-issues">기본 필터링에서 발견된 문제가 없습니다.</p>
        )}
      </div>

      {/* LLM 분석 결과 */}
      {analysisResult && (
        <div className="llm-analysis-section">
          <h3>🧠 LLM 심층 분석</h3>
          
          <div className="risk-level">
            <span className="risk-label">위험도:</span>
            <span 
              className="risk-badge"
              style={{ backgroundColor: getRiskColor(analysisResult.riskLevel) }}
            >
              {analysisResult.riskLevel}
            </span>
          </div>

          <div className="misconfigs-section">
            <h4>🚨 발견된 문제 설정</h4>
            <ul>
              {analysisResult.keyMisconfigs.map((misconfig, idx) => (
                <li key={idx}>{misconfig}</li>
              ))}
            </ul>
          </div>

          <div className="threats-section">
            <h4>⚠️ 잠재적 위협</h4>
            <ul>
              {analysisResult.potentialThreats.map((threat, idx) => (
                <li key={idx}>{threat}</li>
              ))}
            </ul>
          </div>

          <div className="patched-section">
            <div className="patched-header">
              <h4>✅ 개선된 보안 설정</h4>
              <button 
                className="toggle-button"
                onClick={() => setShowPatched(!showPatched)}
              >
                {showPatched ? '숨기기' : '보기'}
              </button>
            </div>
            {showPatched && (
              <div className="patched-content">
                <pre><code>{JSON.stringify(analysisResult.patchedConfig, null, 2)}</code></pre>
                <button 
                  className="download-button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(analysisResult.patchedConfig, null, 2)], 
                      { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `patched-${fileType}-${Date.now()}.json`
                    a.click()
                  }}
                >
                  💾 다운로드
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!analysisResult && !isAnalyzing && (
        <div className="analysis-placeholder">
          <p>파일을 업로드하고 "LLM 분석 시작" 버튼을 클릭하세요.</p>
        </div>
      )}
    </div>
  )
}

export default AnalysisPanel

