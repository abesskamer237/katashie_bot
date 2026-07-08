/**
 * Calcule le coût en crédits (miroir du backend)
 */
export function calculateServerCost(params: {
  ram: number; cpu: number; disk: number; maxSessions: number; durationDays: number;
}): number {
  const { ram, cpu, disk, maxSessions, durationDays } = params;
  const ramScore = ram / 512;
  const cpuScore = cpu / 50;
  const diskScore = disk / 1024;
  const sessionScore = maxSessions / 2;
  const durationScore = durationDays / 7;
  const base = (ramScore + cpuScore + diskScore + sessionScore) * durationScore;
  return Math.max(15, Math.ceil(base * 5));
}
