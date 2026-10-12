import { BountyParser } from '../parsers/bounty_parser';
import { BountyPattern } from '../types/bounty';

export class MonitorEngine {
  private activeBounties: Map<number, BountyPattern> = new Map();

  public async processIncomingMessage(message: string): Promise<void> {
    const parsedBounty = BountyParser.parse(message);
    
    if (parsedBounty) {
      console.log(`[Radar] New Bounty Detected: ${parsedBounty.id} - ${parsedBounty.metadata.description}`);
      this.activeBounties.set(parsedBounty.id, parsedBounty);
      await this.initializeMonitoring(parsedBounty);
    }
  }

  private async initializeMonitoring(bounty: BountyPattern): Promise<void> {
    if (bounty.metadata.isWeeklyContest) {
      // Configura monitoramento de fechamento semanal para Stacker Stocks
      console.log(`[Monitor] Initializing Weekly Close strategy for ${bounty.user}`);
      // Implementação de polling para os endpoints de preço baseados na estratégia split '|'
    }
  }
}
