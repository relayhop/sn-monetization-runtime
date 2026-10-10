// Patch for #1269: [radar] SN open bounty 2026-10-10T12:22
export function handleSafePayload(payload: any) {
  if (!payload || typeof payload !== 'object') return null;
  return { ...payload, processedAt: Date.now() };
}
