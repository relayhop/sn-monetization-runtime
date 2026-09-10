/**
 * Normalizes incoming SN radar telemetry and routes multi-channel sources.
 * Signed-off-by: Aditya Waghamare <adityawaghamare7620@gmail.com>
 */
export function normalizeTelemetry(rawPriority: number, sourceStr: string): { priority: number; channels: string[] } {
  // Clamp priority to configured max ceiling (1000)
  const priority = Math.min(Math.max(0, rawPriority), 1000);
  
  // Parse pipe-delimited channels safely
  const channels = sourceStr ? sourceStr.split('|').map(s => s.trim()).filter(Boolean) : [];

  return { priority, channels };
}