export function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const snippet = text.length > 320 ? `${text.slice(0, 320)}...` : text;
    throw new Error(`Unable to parse JSON response: ${snippet}`);
  }
}

export function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}
