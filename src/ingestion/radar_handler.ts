import { Signal, OpenBounty } from '../types';
import { Database } from '../db';

export async function handleRadarSignal(signal: Signal, db: Database): Promise<void> {
  if (signal.tags.includes('OPEN_BOUNTY')) {
    const bountyData: OpenBounty = {
      id: signal.id,
      category: signal.category,
      priority: signal.priority,
      score: signal.score,
      tags: signal.tags,
      title: signal.title,
      timestamp: new Date().toISOString(),
    };
    
    await db.bounties.upsert(bountyData);
    console.log(`[Radar] Successfully ingested OPEN_BOUNTY: ${bountyData.id} - ${bountyData.title}`);
  }
}