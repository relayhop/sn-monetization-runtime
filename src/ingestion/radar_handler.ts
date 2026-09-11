import { Signal, OpenBountyRecord } from '../types';
import { QueueManager } from '../queue';

export class RadarBountyIngestor {
  private queue = new QueueManager();

  public async processSignal(signal: Signal): Promise<void> {
    if (!signal.tags.includes('OPEN_BOUNTY')) {
      return;
    }

    const parts = signal.rawPayload.split('\t');
    if (parts.length < 12) {
      throw new Error(`Invalid telemetry payload length: ${parts.length}`);
    }

    const record: OpenBountyRecord = {
      id: parseInt(parts[0], 10),
      category: parts[1],
      weight: parseFloat(parts[2]),
      score: parseInt(parts[3], 10),
      threshold: parseInt(parts[4], 10),
      priority: parseInt(parts[5], 10),
      ratio: parseFloat(parts[6]),
      reach: parseInt(parts[7], 10),
      engagement: parseInt(parts[8], 10),
      sources: parts[9].split('|'),
      tags: parts[10].split(','),
      title: parts[11],
      ingestedAt: new Date().toISOString()
    };

    await this.queue.enqueueBounty(record);
  }
}