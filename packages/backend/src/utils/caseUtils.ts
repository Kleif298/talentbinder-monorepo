// Utility: convert object keys from snake_case to camelCase
export function snakeToCamelObj(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([A-Za-z0-9])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

export function snakeToCamelArray(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(r => snakeToCamelObj(r));
}
