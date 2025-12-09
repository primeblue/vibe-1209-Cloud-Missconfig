/**
 * Vercel Serverless Function
 * OpenAI API를 서버 사이드에서 호출하여 API 키를 보호
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 환경 변수에서 API 키 가져오기 (서버 사이드에서만 접근 가능)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error('OpenAI API 키가 설정되지 않았습니다.')
      return res.status(500).json({ 
        error: '서버 설정 오류: OpenAI API 키가 설정되지 않았습니다.' 
      })
    }

    // 요청 본문에서 데이터 추출
    const { fileContent, fileType, filteredIssues } = req.body

    if (!fileContent) {
      return res.status(400).json({ error: 'fileContent가 필요합니다.' })
    }

    // 파일 내용 파싱 시도
    let parsedContent
    try {
      parsedContent = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent
    } catch (e) {
      parsedContent = fileContent
    }

    // 프롬프트 생성
    const systemPrompt = `당신은 클라우드 보안 전문가입니다. 제공된 클라우드 설정 파일을 분석하여 보안 취약점을 찾고 개선안을 제시하세요.

응답은 반드시 다음 JSON 형식으로 반환해야 합니다:
{
  "riskLevel": "High" | "Medium" | "Low",
  "keyMisconfigs": ["문제1", "문제2", ...],
  "potentialThreats": ["위협1", "위협2", ...],
  "patchedConfig": { ... 개선된 설정 JSON ... }
}`

    const userPrompt = `다음 ${fileType || 'unknown'} 설정 파일을 분석해주세요:

${JSON.stringify(parsedContent, null, 2)}

1차 필터링에서 발견된 문제:
${(filteredIssues || []).map(issue => `- ${issue.type}: ${issue.description}`).join('\n')}

위험도, 주요 문제 설정, 잠재적 위협, 그리고 개선된 보안 설정을 포함한 JSON 응답을 반환해주세요.`

    // OpenAI API 호출
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 토큰 절감을 위해 mini 모델 사용
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000 // 토큰 소모량 제한
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API 오류:', errorData)
      return res.status(response.status).json({ 
        error: `OpenAI API 오류: ${response.status} - ${errorData.error?.message || response.statusText}` 
      })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return res.status(500).json({ error: 'LLM 응답이 비어있습니다.' })
    }

    // JSON 응답 파싱
    let result
    try {
      // 코드 블록 제거 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(content)
      }
    } catch (e) {
      // JSON 파싱 실패 시 기본 구조 반환
      console.warn('LLM 응답 파싱 실패, 기본 구조 사용:', e)
      result = {
        riskLevel: 'Medium',
        keyMisconfigs: ['응답 파싱 실패'],
        potentialThreats: ['LLM 응답을 파싱할 수 없습니다'],
        patchedConfig: parsedContent
      }
    }

    // 필수 필드 검증
    if (!result.riskLevel) result.riskLevel = 'Medium'
    if (!result.keyMisconfigs) result.keyMisconfigs = []
    if (!result.potentialThreats) result.potentialThreats = []
    if (!result.patchedConfig) result.patchedConfig = parsedContent

    // 성공 응답
    return res.status(200).json(result)

  } catch (error) {
    console.error('서버 오류:', error)
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다: ' + error.message 
    })
  }
}

