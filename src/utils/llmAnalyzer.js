/**
 * LLM API를 통한 심층 분석
 * Vercel Serverless Function을 통해 API 키를 보호
 */

// 개발 환경에서는 로컬 Vercel Function 사용, 프로덕션에서는 자동으로 Vercel이 처리
const getApiUrl = () => {
  // 개발 환경에서 Vercel CLI로 실행하는 경우
  if (import.meta.env.DEV) {
    return '/api/analyze'
  }
  // 프로덕션 환경
  return '/api/analyze'
}

export async function analyzeWithLLM(fileContent, fileType, filteredIssues) {
  const apiUrl = getApiUrl()

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileContent,
        fileType,
        filteredIssues
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `서버 오류: ${response.status} - ${response.statusText}`)
    }

    const result = await response.json()

    // 필수 필드 검증
    if (!result.riskLevel) result.riskLevel = 'Medium'
    if (!result.keyMisconfigs) result.keyMisconfigs = []
    if (!result.potentialThreats) result.potentialThreats = []
    if (!result.patchedConfig) {
      // fileContent를 파싱하여 기본값 설정
      try {
        result.patchedConfig = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent
      } catch (e) {
        result.patchedConfig = fileContent
      }
    }

    return result

  } catch (error) {
    console.error('LLM 분석 오류:', error)
    throw error
  }
}

