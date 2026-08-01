export function fixDoubleEncoding(str: string): string {
  try {
    const fixed = Buffer.from(str, 'latin1').toString('utf8');
    if (fixed !== str && !fixed.includes('\uFFFD')) {
      return fixed;
    }
    return str;
  } catch {
    return str;
  }
}

const CORRUPTION_PATTERNS: Record<string, string> = {
  '\u00D2\u25CA\u222E': '\u2192',
  '\u00D2\u25CA\u2225': '\u2192',
  '\u00D2\u00A2\u2225': '\u2192',
  '\u00D2\u0161\u00D2\u25CA': '\u2192',
  '\u00D2\u25CA\u00A2\u2225': '\u2192',
};

function fixCorruptionPatterns(str: string): string {
  let fixed = str;
  for (const [pattern, replacement] of Object.entries(CORRUPTION_PATTERNS)) {
    fixed = fixed.split(pattern).join(replacement);
  }
  return fixed;
}

export function fixEncoding(str: string): string {
  let fixed = fixDoubleEncoding(str);
  if (fixed !== str) return fixed;
  fixed = fixCorruptionPatterns(str);
  if (fixed !== str) return fixed;
  return str;
}

export function fixEncodingObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return fixEncoding(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(fixEncodingObject) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = fixEncodingObject(value);
    }
    return result as T;
  }
  return obj;
}