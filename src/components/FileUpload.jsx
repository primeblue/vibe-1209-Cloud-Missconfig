import { useState } from 'react'
import './FileUpload.css'

function FileUpload({ onFileLoad, onReset }) {
  const [fileName, setFileName] = useState('')
  const [inputMode, setInputMode] = useState('file') // 'file' or 'text'
  const [textInput, setTextInput] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setTextInput('') // 텍스트 입력 초기화
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target.result
      const fileType = detectFileType(file.name, content)
      onFileLoad(content, fileType)
    }
    
    reader.onerror = () => {
      alert('파일 읽기 오류가 발생했습니다.')
    }
    
    reader.readAsText(file)
  }

  const handleTextInput = (e) => {
    const text = e.target.value
    setTextInput(text)
    setFileName('') // 파일명 초기화
    
    if (text.trim()) {
      const fileType = detectFileType('', text)
      onFileLoad(text, fileType)
    } else {
      onReset()
    }
  }

  const handleModeChange = (mode) => {
    setInputMode(mode)
    if (mode === 'file') {
      setTextInput('')
    } else {
      setFileName('')
    }
    onReset()
  }

  const detectFileType = (fileName, content) => {
    const lowerName = fileName.toLowerCase()
    
    if (lowerName.includes('s3') || lowerName.includes('bucket')) {
      return 'aws-s3'
    }
    if (lowerName.includes('iam') || lowerName.includes('policy')) {
      return 'aws-iam'
    }
    if (lowerName.includes('gcp') || lowerName.includes('service-account')) {
      return 'gcp'
    }
    if (lowerName.includes('azure') || lowerName.includes('nsg')) {
      return 'azure'
    }
    
    // 내용 기반 감지
    let parsed
    try {
      // JSON 파싱 시도
      parsed = JSON.parse(content)
    } catch (e) {
      // YAML 파싱 시도 (간단한 변환)
      try {
        parsed = parseYAML(content)
      } catch (yamlError) {
        // 파싱 실패
        return 'unknown'
      }
    }
    
    if (parsed) {
      if (parsed.Version && parsed.Statement) return 'aws-iam'
      if (parsed.Bucket) return 'aws-s3'
      if (parsed.type === 'service_account') return 'gcp'
      if (parsed.properties && parsed.properties.securityRules) return 'azure'
    }
    
    return 'unknown'
  }

  // 간단한 YAML → JSON 변환 (기본적인 경우만 처리)
  const parseYAML = (yamlText) => {
    // 매우 간단한 YAML 파서 (실제 프로덕션에서는 라이브러리 사용 권장)
    // 여기서는 기본적인 키-값 쌍만 처리
    const lines = yamlText.split('\n')
    const result = {}
    let currentObj = result
    const stack = []
    
    for (let line of lines) {
      line = line.trim()
      if (!line || line.startsWith('#')) continue
      
      const indent = line.match(/^(\s*)/)[1].length
      const keyValue = line.split(':').map(s => s.trim())
      
      if (keyValue.length >= 2) {
        const key = keyValue[0]
        const value = keyValue.slice(1).join(':').trim()
        
        // 배열 처리
        if (value.startsWith('-')) {
          if (!currentObj[key]) currentObj[key] = []
          currentObj[key].push(value.substring(1).trim())
        } else if (value === '' || value === '{}') {
          // 객체 시작
          currentObj[key] = {}
        } else {
          // 값 설정
          // 숫자 변환 시도
          if (/^-?\d+$/.test(value)) {
            currentObj[key] = parseInt(value, 10)
          } else if (/^-?\d+\.\d+$/.test(value)) {
            currentObj[key] = parseFloat(value)
          } else if (value === 'true' || value === 'false') {
            currentObj[key] = value === 'true'
          } else if (value === 'null') {
            currentObj[key] = null
          } else {
            // 문자열 (따옴표 제거)
            currentObj[key] = value.replace(/^["']|["']$/g, '')
          }
        }
      }
    }
    
    return result
  }

  const loadSampleFile = async (sampleName) => {
    try {
      const response = await fetch(`/samples/${sampleName}`)
      const content = await response.text()
      const fileType = detectFileType(sampleName, content)
      setFileName(sampleName)
      onFileLoad(content, fileType)
    } catch (error) {
      alert('샘플 파일을 불러올 수 없습니다: ' + error.message)
    }
  }

  return (
    <div className="file-upload">
      {/* 모드 선택 탭 */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${inputMode === 'file' ? 'active' : ''}`}
          onClick={() => handleModeChange('file')}
        >
          📁 파일 업로드
        </button>
        <button
          className={`mode-tab ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => handleModeChange('text')}
        >
          ✏️ 텍스트 입력
        </button>
      </div>

      {inputMode === 'file' ? (
        <>
          <div className="upload-controls">
            <label className="upload-button">
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              📁 파일 선택
            </label>
            
            {fileName && (
              <button className="reset-button" onClick={onReset}>
                🔄 초기화
              </button>
            )}
          </div>

          {fileName && (
            <div className="file-info">
              <span>선택된 파일: {fileName}</span>
            </div>
          )}

          <div className="sample-files">
            <p className="sample-label">📚 실습용 샘플 파일:</p>
            <div className="sample-buttons">
              <button onClick={() => loadSampleFile('s3-public-bucket.json')}>
                AWS S3 (Public)
              </button>
              <button onClick={() => loadSampleFile('iam-admin-policy.json')}>
                AWS IAM (Admin)
              </button>
              <button onClick={() => loadSampleFile('gcp-service-account.json')}>
                GCP Service Account
              </button>
              <button onClick={() => loadSampleFile('azure-nsg-open.json')}>
                Azure NSG (Open)
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-input-section">
            <div className="text-input-header">
              <label htmlFor="config-text-input">
                <strong>JSON 또는 YAML 텍스트를 입력하세요:</strong>
              </label>
              <button className="reset-button" onClick={() => {
                setTextInput('')
                onReset()
              }}>
                🔄 초기화
              </button>
            </div>
            <textarea
              id="config-text-input"
              className="config-textarea"
              value={textInput}
              onChange={handleTextInput}
              placeholder={`예시 JSON:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}

또는 YAML:
Version: "2012-10-17"
Statement:
  - Effect: Allow
    Action: "*"
    Resource: "*"`}
              rows={12}
            />
            <div className="text-input-info">
              <span>💡 팁: JSON 또는 YAML 형식의 클라우드 설정을 직접 입력할 수 있습니다.</span>
            </div>
          </div>

          <div className="sample-files">
            <p className="sample-label">📚 샘플 템플릿:</p>
            <div className="sample-buttons">
              <button onClick={() => {
                setTextInput(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}`)
                const content = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}`
                onFileLoad(content, detectFileType('', content))
              }}>
                AWS S3 예제
              </button>
              <button onClick={() => {
                setTextInput(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}`)
                const content = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}`
                onFileLoad(content, detectFileType('', content))
              }}>
                AWS IAM 예제
              </button>
              <button onClick={() => {
                setTextInput(`{
  "type": "service_account",
  "project_id": "my-project",
  "iam_bindings": [
    {
      "role": "roles/owner",
      "members": ["allUsers"]
    }
  ]
}`)
                const content = `{
  "type": "service_account",
  "project_id": "my-project",
  "iam_bindings": [
    {
      "role": "roles/owner",
      "members": ["allUsers"]
    }
  ]
}`
                onFileLoad(content, detectFileType('', content))
              }}>
                GCP 예제
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FileUpload

