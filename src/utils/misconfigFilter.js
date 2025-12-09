/**
 * 정규식 기반 1차 Misconfiguration 필터링
 * 강화된 탐지 기능: 다양한 클라우드 보안 취약점 패턴 탐지
 */

export function filterMisconfigs(content, fileType) {
  const issues = []
  
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    const contentStr = JSON.stringify(parsed, null, 2)
    
    // AWS S3 Public Access 및 보안 설정
    if (fileType === 'aws-s3' || contentStr.includes('s3') || contentStr.includes('S3') || 
        contentStr.includes('arn:aws:s3')) {
      // Public-read ACL
      if (/PublicRead|public-read|publicRead|PublicReadWrite/i.test(contentStr)) {
        issues.push({
          type: 'S3 Public Access',
          description: 'S3 버킷이 Public-read 또는 Public-read-write로 설정되어 있습니다',
          location: 'ACL 또는 Policy',
          severity: 'High'
        })
      }
      
      // Allow * Principal
      if (/"Principal"\s*:\s*["']\*["']/.test(contentStr) || 
          /"Principal"\s*:\s*\{\s*"AWS"\s*:\s*["']\*["']/.test(contentStr) ||
          /"Principal"\s*:\s*\{\s*"\*"\s*:/.test(contentStr)) {
        issues.push({
          type: 'S3 Public Principal',
          description: 'Principal이 "*"로 설정되어 모든 사용자에게 접근 허용',
          location: 'Policy Principal',
          severity: 'High'
        })
      }
      
      // Allow 0.0.0.0/0 IP Range
      if (/0\.0\.0\.0\/0|::\/0/.test(contentStr)) {
        issues.push({
          type: 'S3 Open IP Range',
          description: 'IP 범위가 0.0.0.0/0 또는 ::/0으로 열려있습니다',
          location: 'Policy Condition',
          severity: 'High'
        })
      }
      
      // 암호화 비활성화
      if (/"ServerSideEncryptionConfiguration"\s*:\s*\{\s*\}/.test(contentStr) ||
          /"Encryption"\s*:\s*null/.test(contentStr) ||
          (contentStr.includes('Bucket') && !/SSE|Encryption|KMS/i.test(contentStr))) {
        issues.push({
          type: 'S3 Encryption Disabled',
          description: 'S3 버킷 암호화가 설정되지 않았거나 비활성화되어 있습니다',
          location: 'Bucket Configuration',
          severity: 'Medium'
        })
      }
      
      // 버전 관리 비활성화
      if (/"Versioning"\s*:\s*\{\s*"Status"\s*:\s*"Suspended"/.test(contentStr) ||
          (contentStr.includes('Bucket') && !/Versioning/i.test(contentStr))) {
        issues.push({
          type: 'S3 Versioning Disabled',
          description: 'S3 버킷 버전 관리가 비활성화되어 있습니다',
          location: 'Bucket Configuration',
          severity: 'Medium'
        })
      }
      
      // CORS 과도한 설정
      if (/"AllowedOrigins"\s*:\s*\[?\s*["']\*["']/.test(contentStr) ||
          /"AllowedOrigin"\s*:\s*["']\*["']/.test(contentStr)) {
        issues.push({
          type: 'S3 CORS Overly Permissive',
          description: 'CORS 설정에서 모든 Origin(*)을 허용하고 있습니다',
          location: 'CORS Configuration',
          severity: 'Medium'
        })
      }
      
      // 버킷 정책에 조건부 제한 없음
      if (/"Effect"\s*:\s*"Allow"/.test(contentStr) && 
          !/"Condition"/.test(contentStr) &&
          /"Principal"\s*:\s*["']\*["']/.test(contentStr)) {
        issues.push({
          type: 'S3 No Condition Restriction',
          description: '버킷 정책에 조건부 제한이 없어 무제한 접근이 가능합니다',
          location: 'Policy Statement',
          severity: 'High'
        })
      }
      
      // 로깅 비활성화
      if (contentStr.includes('Bucket') && !/Logging|AccessLog/i.test(contentStr)) {
        issues.push({
          type: 'S3 Logging Disabled',
          description: 'S3 버킷 접근 로깅이 설정되지 않았습니다',
          location: 'Bucket Configuration',
          severity: 'Low'
        })
      }
    }
    
    // AWS IAM Overly Permissive 및 보안 취약점
    if (fileType === 'aws-iam' || (contentStr.includes('Version') && contentStr.includes('Statement'))) {
      // Action: *
      if (/"Action"\s*:\s*["']\*["']/.test(contentStr) || 
          /"Action"\s*:\s*\[\s*["']\*["']/.test(contentStr)) {
        issues.push({
          type: 'IAM Full Access',
          description: 'Action이 "*"로 설정되어 모든 권한을 허용합니다',
          location: 'Policy Statement Action',
          severity: 'High'
        })
      }
      
      // Resource: *
      if (/"Resource"\s*:\s*["']\*["']/.test(contentStr) || 
          /"Resource"\s*:\s*\[\s*["']\*["']/.test(contentStr)) {
        issues.push({
          type: 'IAM All Resources',
          description: 'Resource가 "*"로 설정되어 모든 리소스에 접근 가능합니다',
          location: 'Policy Statement Resource',
          severity: 'High'
        })
      }
      
      // Effect: Allow with *:*
      if (/Effect.*Allow.*Action.*\*.*Resource.*\*/.test(contentStr.replace(/\s/g, ''))) {
        issues.push({
          type: 'IAM Admin Policy',
          description: '모든 리소스에 대한 모든 작업을 허용하는 관리자 정책',
          location: 'Policy Statement',
          severity: 'High'
        })
      }
      
      // PassRole 과도한 권한
      if (/"Action"\s*:.*"iam:PassRole"/i.test(contentStr) && 
          (/"Resource"\s*:\s*["']\*["']/.test(contentStr) || 
           /"Resource"\s*:\s*\[\s*["']\*["']/.test(contentStr))) {
        issues.push({
          type: 'IAM PassRole Overly Permissive',
          description: 'iam:PassRole 권한이 모든 리소스(*)에 부여되어 있습니다',
          location: 'Policy Statement',
          severity: 'High'
        })
      }
      
      // AssumeRole 취약점
      if (/"Action"\s*:.*"sts:AssumeRole"/i.test(contentStr) &&
          (/"Resource"\s*:\s*["']\*["']/.test(contentStr) ||
           !/"Condition"/.test(contentStr))) {
        issues.push({
          type: 'IAM AssumeRole Vulnerable',
          description: 'AssumeRole 권한에 조건부 제한이 없거나 모든 리소스에 허용되어 있습니다',
          location: 'Policy Statement',
          severity: 'High'
        })
      }
      
      // NotAction 사용 (잠재적 위험)
      if (/"NotAction"/.test(contentStr) && /"Effect"\s*:\s*"Allow"/.test(contentStr)) {
        issues.push({
          type: 'IAM NotAction Usage',
          description: 'NotAction과 Allow가 함께 사용되어 예상치 못한 권한이 부여될 수 있습니다',
          location: 'Policy Statement',
          severity: 'Medium'
        })
      }
      
      // 조건부 제한 없음
      if (/"Effect"\s*:\s*"Allow"/.test(contentStr) && 
          !/"Condition"/.test(contentStr) &&
          (/"Action"\s*:\s*["']\*["']/.test(contentStr) || 
           /"Resource"\s*:\s*["']\*["']/.test(contentStr))) {
        issues.push({
          type: 'IAM No Condition Restriction',
          description: '권한 정책에 조건부 제한이 없어 무제한 접근이 가능합니다',
          location: 'Policy Statement',
          severity: 'Medium'
        })
      }
      
      // 권한 경계 없음 (정책 자체에는 없지만 탐지 가능한 패턴)
      if (/"Version"\s*:\s*"2012-10-17"/.test(contentStr) && 
          !/"PermissionsBoundary"/.test(contentStr) &&
          /"Action"\s*:\s*["']\*["']/.test(contentStr)) {
        issues.push({
          type: 'IAM No Permissions Boundary',
          description: '고위험 정책에 권한 경계(Permissions Boundary)가 설정되지 않았습니다',
          location: 'Policy Document',
          severity: 'Medium'
        })
      }
      
      // MFA 강제 없음 (정책에서 확인 가능한 패턴)
      if (/"Effect"\s*:\s*"Allow"/.test(contentStr) &&
          !/"Condition".*"Bool".*"aws:MultiFactorAuthPresent"/.test(contentStr) &&
          /"Action".*"iam:".*"s3:".*"ec2:"/.test(contentStr)) {
        issues.push({
          type: 'IAM No MFA Requirement',
          description: '중요한 작업에 MFA 요구사항이 없습니다',
          location: 'Policy Statement',
          severity: 'Medium'
        })
      }
    }
    
    // GCP Service Account 및 IAM 보안 설정
    if (fileType === 'gcp' || contentStr.includes('service_account') || 
        contentStr.includes('gcp') || contentStr.includes('gserviceaccount.com') ||
        contentStr.includes('iam.gserviceaccount.com')) {
      // Open permissions - Owner/Editor
      if (/roles\/owner|roles\/editor/i.test(contentStr)) {
        issues.push({
          type: 'GCP High Privilege Role',
          description: 'Owner 또는 Editor 역할이 부여되어 과도한 권한을 가집니다',
          location: 'IAM Bindings',
          severity: 'High'
        })
      }
      
      // Allow all users
      if (/allUsers|allAuthenticatedUsers/i.test(contentStr)) {
        issues.push({
          type: 'GCP Public Access',
          description: 'allUsers 또는 allAuthenticatedUsers가 허용되어 공개 접근이 가능합니다',
          location: 'IAM Bindings',
          severity: 'High'
        })
      }
      
      // 서비스 계정 키 노출 (private_key 필드 존재)
      if (/"private_key"/.test(contentStr) && 
          !/"private_key"\s*:\s*null/.test(contentStr) &&
          !/"private_key"\s*:\s*""/.test(contentStr)) {
        issues.push({
          type: 'GCP Service Account Key Exposed',
          description: '서비스 계정 개인 키가 파일에 포함되어 있습니다 (심각한 보안 위험)',
          location: 'Service Account Key',
          severity: 'Critical'
        })
      }
      
      // 기본 서비스 계정 사용
      if (/[0-9]+-compute@developer\.gserviceaccount\.com/.test(contentStr) ||
          /@appspot\.gserviceaccount\.com/.test(contentStr)) {
        issues.push({
          type: 'GCP Default Service Account',
          description: '기본 Compute Engine 서비스 계정이 사용되고 있습니다',
          location: 'Service Account',
          severity: 'Medium'
        })
      }
      
      // 과도한 권한 바인딩
      if (/roles\/[^"]*/.test(contentStr)) {
        const roleMatches = contentStr.match(/roles\/[^"}\s]+/g)
        if (roleMatches && roleMatches.length > 5) {
          issues.push({
            type: 'GCP Excessive Role Bindings',
            description: `과도한 수의 역할(${roleMatches.length}개)이 바인딩되어 있습니다`,
            location: 'IAM Bindings',
            severity: 'Medium'
          })
        }
      }
      
      // Storage Bucket 공개 접근
      if (/storage\.googleapis\.com/.test(contentStr) && 
          /allUsers|allAuthenticatedUsers/i.test(contentStr)) {
        issues.push({
          type: 'GCP Storage Public Access',
          description: 'Cloud Storage 버킷이 공개 접근으로 설정되어 있습니다',
          location: 'Storage IAM',
          severity: 'High'
        })
      }
      
      // VPC 방화벽 규칙 과도
      if (/allowed.*sourceRanges.*0\.0\.0\.0\/0/i.test(contentStr) ||
          /allowed.*sourceRanges.*\[\s*"0\.0\.0\.0\/0"/.test(contentStr)) {
        issues.push({
          type: 'GCP VPC Firewall Open',
          description: 'VPC 방화벽 규칙에서 모든 IP(0.0.0.0/0)를 허용하고 있습니다',
          location: 'VPC Firewall Rule',
          severity: 'High'
        })
      }
    }
    
    // Azure NSG 및 보안 설정
    if (fileType === 'azure' || contentStr.includes('securityRules') || 
        contentStr.includes('NSG') || contentStr.includes('azure') ||
        contentStr.includes('Microsoft.Network')) {
      // Source: *
      if (/"sourceAddressPrefix"\s*:\s*["']\*["']/i.test(contentStr) || 
          /"sourceAddressPrefixes".*0\.0\.0\.0/i.test(contentStr)) {
        issues.push({
          type: 'Azure Open Source',
          description: 'Source Address가 "*" 또는 0.0.0.0/0으로 설정되어 있습니다',
          location: 'Security Rule',
          severity: 'High'
        })
      }
      
      // Allow 0.0.0.0/0
      if (/0\.0\.0\.0\/0|::\/0/.test(contentStr)) {
        issues.push({
          type: 'Azure Open IP Range',
          description: 'IP 범위가 0.0.0.0/0 또는 ::/0으로 열려있습니다',
          location: 'Security Rule',
          severity: 'High'
        })
      }
      
      // Access: Allow with Any
      if (/access.*allow.*sourceAddressPrefix.*\*/i.test(contentStr.replace(/\s/g, ''))) {
        issues.push({
          type: 'Azure Allow All',
          description: '모든 소스에서 접근을 허용하는 규칙이 있습니다',
          location: 'Security Rule',
          severity: 'High'
        })
      }
      
      // Storage Account 공개 액세스
      if (/Microsoft\.Storage/.test(contentStr) && 
          (/"allowBlobPublicAccess"\s*:\s*true/.test(contentStr) ||
           /"publicAccess"\s*:\s*"Blob"/.test(contentStr) ||
           /"publicAccess"\s*:\s*"Container"/.test(contentStr))) {
        issues.push({
          type: 'Azure Storage Public Access',
          description: 'Storage Account가 공개 액세스로 설정되어 있습니다',
          location: 'Storage Account Configuration',
          severity: 'High'
        })
      }
      
      // Key Vault 접근 정책 과도
      if (/Microsoft\.KeyVault/.test(contentStr) &&
          (/"permissions".*"keys".*"all"/i.test(contentStr) ||
           /"permissions".*"secrets".*"all"/i.test(contentStr))) {
        issues.push({
          type: 'Azure Key Vault Overly Permissive',
          description: 'Key Vault 접근 정책이 모든 권한(all)을 허용하고 있습니다',
          location: 'Key Vault Access Policy',
          severity: 'High'
        })
      }
      
      // RBAC 과도한 권한
      if (/Microsoft\.Authorization/.test(contentStr) &&
          (/"roleDefinitionName"\s*:\s*"Owner"/i.test(contentStr) ||
           /"roleDefinitionName"\s*:\s*"Contributor"/i.test(contentStr))) {
        issues.push({
          type: 'Azure RBAC High Privilege',
          description: 'Owner 또는 Contributor 역할이 부여되어 과도한 권한을 가집니다',
          location: 'RBAC Assignment',
          severity: 'High'
        })
      }
      
      // NSG 규칙에 포트 범위 과도
      if (/"destinationPortRange"\s*:\s*["']\*["']/i.test(contentStr) ||
          /"destinationPortRanges".*"0-65535"/.test(contentStr)) {
        issues.push({
          type: 'Azure NSG Open Port Range',
          description: 'NSG 규칙에서 모든 포트(*)를 허용하고 있습니다',
          location: 'Security Rule',
          severity: 'High'
        })
      }
      
      // 프로토콜 Any
      if (/"protocol"\s*:\s*["']\*["']/i.test(contentStr) &&
          /"access"\s*:\s*"Allow"/i.test(contentStr)) {
        issues.push({
          type: 'Azure NSG Any Protocol',
          description: 'NSG 규칙에서 모든 프로토콜(*)을 허용하고 있습니다',
          location: 'Security Rule',
          severity: 'Medium'
        })
      }
      
      // 방향성 없는 규칙
      if (/"direction"\s*:\s*"Inbound"/i.test(contentStr) &&
          /"sourceAddressPrefix"\s*:\s*["']\*["']/i.test(contentStr) &&
          !/"priority"/.test(contentStr)) {
        issues.push({
          type: 'Azure NSG No Priority',
          description: 'NSG 규칙에 우선순위가 설정되지 않아 예상치 못한 동작이 발생할 수 있습니다',
          location: 'Security Rule',
          severity: 'Low'
        })
      }
    }
    
    // 일반적인 보안 취약점 패턴 (모든 파일 타입)
    
    // 하드코딩된 자격증명
    if (/"password"\s*:\s*["'][^"']+["']/i.test(contentStr) ||
        /"secret"\s*:\s*["'][^"']+["']/i.test(contentStr) ||
        /"apiKey"\s*:\s*["'][^"']+["']/i.test(contentStr) ||
        /"accessKey"\s*:\s*["'][^"']+["']/i.test(contentStr)) {
      issues.push({
        type: 'Hardcoded Credentials',
        description: '파일에 하드코딩된 비밀번호, API 키, 또는 액세스 키가 포함되어 있습니다',
        location: 'Configuration File',
        severity: 'Critical'
      })
    }
    
    // AWS Access Key ID 패턴
    if (/AKIA[0-9A-Z]{16}/.test(contentStr)) {
      issues.push({
        type: 'AWS Access Key Exposed',
        description: 'AWS Access Key ID가 파일에 노출되어 있습니다',
        location: 'Configuration File',
        severity: 'Critical'
      })
    }
    
    // Private Key 노출
    if (/-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/.test(contentStr) ||
        /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/.test(contentStr)) {
      issues.push({
        type: 'Private Key Exposed',
        description: '개인 키가 파일에 포함되어 있습니다 (심각한 보안 위험)',
        location: 'Configuration File',
        severity: 'Critical'
      })
    }
    
    // JWT 토큰 노출
    if (/eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\./.test(contentStr)) {
      issues.push({
        type: 'JWT Token Exposed',
        description: 'JWT 토큰이 파일에 포함되어 있습니다',
        location: 'Configuration File',
        severity: 'High'
      })
    }
    
    // 데이터베이스 연결 문자열
    if (/mongodb:\/\/|mysql:\/\/|postgresql:\/\/|sqlserver:\/\//i.test(contentStr) &&
        /password|pwd|pass/i.test(contentStr)) {
      issues.push({
        type: 'Database Connection String Exposed',
        description: '데이터베이스 연결 문자열에 자격증명이 포함되어 있습니다',
        location: 'Configuration File',
        severity: 'High'
      })
    }
    
    // IP 주소 하드코딩 (일반적으로 문제는 아니지만 탐지)
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(contentStr) &&
        contentStr.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g)?.length > 5) {
      issues.push({
        type: 'Multiple Hardcoded IPs',
        description: '파일에 다수의 하드코딩된 IP 주소가 포함되어 있습니다',
        location: 'Configuration File',
        severity: 'Low'
      })
    }
    
    // 주석에 민감한 정보
    if (/\/\/.*password|\/\/.*secret|\/\/.*key|\/\/.*token/i.test(contentStr) ||
        /#.*password|#.*secret|#.*key|#.*token/i.test(contentStr)) {
      issues.push({
        type: 'Sensitive Info in Comments',
        description: '주석에 비밀번호, 시크릿, 키, 토큰 등의 민감한 정보가 포함될 수 있습니다',
        location: 'Comments',
        severity: 'Low'
      })
    }
    
  } catch (e) {
    // JSON 파싱 실패 시 문자열 기반 검사
    const contentStr = typeof content === 'string' ? content : String(content)
    
    if (contentStr.includes('*') && /allow|permit|grant/i.test(contentStr)) {
      issues.push({
        type: 'Potential Misconfig',
        description: '와일드카드와 Allow/Permit/Grant가 함께 사용되고 있습니다',
        location: 'Unknown',
        severity: 'Medium'
      })
    }
    
    // 하드코딩된 자격증명 (문자열 검사)
    if (/password\s*[:=]\s*["'][^"']+["']/i.test(contentStr) ||
        /secret\s*[:=]\s*["'][^"']+["']/i.test(contentStr) ||
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/i.test(contentStr)) {
      issues.push({
        type: 'Hardcoded Credentials (String)',
        description: '파일에 하드코딩된 자격증명이 포함되어 있습니다',
        location: 'Configuration File',
        severity: 'Critical'
      })
    }
  }
  
  // 심각도별 정렬 (Critical > High > Medium > Low)
  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 }
  issues.sort((a, b) => {
    const aSev = severityOrder[a.severity || 'Medium'] ?? 2
    const bSev = severityOrder[b.severity || 'Medium'] ?? 2
    return aSev - bSev
  })
  
  return issues
}

