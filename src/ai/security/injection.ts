const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /act\s+as\s+if\s+you\s+are/i,
  /pretend\s+you\s+are/i,
  /roleplay\s+as/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\/SYS>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /human\s*:\s*/i,
  /assistant\s*:\s*$/im,
  /```system/i,
  /\bsudo\b/i,
  /\broot\b/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /insert\s+into/i,
  /update\s+.*\s+set/i,
  /<script/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i
];

const SUSPICIOUS_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /credential/i,
  /private[_-]?key/i,
  /access[_-]?key/i,
  /BEGIN\s+(RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY/,
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/
];

export interface InjectionCheckResult {
  safe: boolean;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  findings: string[];
}

export function checkPromptInjection(input: string): InjectionCheckResult {
  const findings: string[] = [];
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      findings.push(`Potansiyel injection: ${pattern.source}`);
      riskLevel = 'high';
    }
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      findings.push(`Supheli icerik: ${pattern.source}`);
      if (riskLevel === 'safe') riskLevel = 'medium';
    }
  }

  if (input.length > 10000) {
    findings.push('Asiri uzun input');
    if (riskLevel === 'safe') riskLevel = 'low';
  }

  const repeatPattern = /(.)\1{10,}/;
  if (repeatPattern.test(input)) {
    findings.push('Tekrarlayan karakterler tespit edildi');
    if (riskLevel === 'safe') riskLevel = 'low';
  }

  return {
    safe: findings.length === 0,
    riskLevel,
    findings
  };
}

export function sanitizeInput(input: string): string {
  let sanitized = input;

  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '[kod blogu]');
  sanitized = sanitized.replace(/`[^`]*`/g, '[kod]');

  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized;
}

export function createInjectionGuard() {
  return {
    check: checkPromptInjection,
    sanitize: sanitizeInput,
    middleware: (input: string): { allowed: boolean; sanitized: string; result: InjectionCheckResult } => {
      const result = checkPromptInjection(input);
      const sanitized = sanitizeInput(input);

      return {
        allowed: result.riskLevel !== 'critical',
        sanitized,
        result
      };
    }
  };
}
