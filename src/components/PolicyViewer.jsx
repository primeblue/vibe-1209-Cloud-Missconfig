import './PolicyViewer.css'

function PolicyViewer({ content, fileType }) {
  const formatContent = (content) => {
    try {
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return content
    }
  }

  const getFileTypeLabel = (type) => {
    const labels = {
      'aws-s3': 'AWS S3 Bucket Policy',
      'aws-iam': 'AWS IAM Policy',
      'gcp': 'GCP Service Account',
      'azure': 'Azure NSG',
      'unknown': 'Unknown'
    }
    return labels[type] || 'Unknown'
  }

  return (
    <div className="policy-viewer">
      <div className="viewer-header">
        <h2>📄 원본 정책</h2>
        <span className="file-type-badge">{getFileTypeLabel(fileType)}</span>
      </div>
      <div className="viewer-content">
        <pre><code>{formatContent(content)}</code></pre>
      </div>
    </div>
  )
}

export default PolicyViewer

