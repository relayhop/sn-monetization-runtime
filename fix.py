class BountyRadar {
  constructor() {
    this.bounties = new Map();
    this.listeners = new Set();
  }

  parseTag(tag) {
    if (!tag) return '';
    const parts = tag.split('|');
    return parts.map(p => p.trim()).filter(Boolean).join('|');
  }

  parseBounty(row) {
    const parts = row.trim().split('\t');
    
    if (parts.length < 3) {
      return {
        id: parts[0],
        title: parts[parts.length - 1],
        tags: parts[parts.length - 1],
        raw: row
      };
    }

    const data = {
      id: parts[0],
      type: parts[parts.length - 2] || parts[parts.length - 3],
      title: parts[parts.length - 1],
      raw: row
    };

    if (parts.length === 9) {
      data.asset = parts[1];
      data.level = parts[2];
      data.value = parts[3];
      data.maxValue = parts[4];
      data.rank = parts[5];
      data.price = parts[6];
      data.userId = parts[7];
    }

    return data;
  }

  detectBounty(line) {
    const bounty = this.parseBounty(line);

    if (!bounty.id) return bounty;

    const existing = this.bounties.get(bounty.id);
    if (existing && !existing.isDuplicate) {
      existing.isDuplicate = true;
    }

    this.bounties.set(bounty.id, bounty);
    this.notifyListeners(bounty);

    return bounty;
  }

  notifyListeners(bounty) {
    this.listeners.forEach(listener => listener(bounty));
  }

  addListener(callback) {
    this.listeners.add(callback);
    return this;
  }

  getBountyById(id) {
    return this.bounties.get(id) || null;
  }

  getFilteredBounties(filters = {}) {
    let filtered = Array.from(this.bounties.values());

    if (filters.asset && filters.asset) {
      filtered = filtered.filter(b => b.asset === filters.asset);
    }

    if (filters.type && filters.type) {
      filtered = filtered.filter(b => b.type === filters.type);
    }

    return filtered;
  }

  getAllBounties() {
    return Array.from(this.bounties.values());
  }

  clearBounty(id) {
    this.bounties.delete(id);
    return this;
  }

  getStats() {
    const total = this.bounties.size;
    const withAsset = Array.from(this.bounties.values()).filter(b => b.asset).length;

    return {
      total,
      withAsset,
      types: Array.from(new Set(this.getAllBounties().map(b => b.type))).length,
      totalListeners: this.listeners.size
    };
  }
}

const radar = new BountyRadar();

function processStream() {
  const lines = [
    '1548616\tbitcoin\t1\t674\t1000\t15\t20.2\t1208996\trecent@bitcoin|top@bitcoin|recent@bitcoin_beginners\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡',
    '1548615\tethereum\t2\t850\t1200\t25\t35.5\t1208995\ttop@ethereum|top@ethereum_beginners\tOPEN_BOUNTY\tHunting 🎯 the stackers ⚡',
    '1548614\tbitcoin\t1\t674\t1000\t15\t20.2\t1208996\trecent@bitcoin|top@bitcoin|recent@bitcoin_beginners\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡'
  ];

  lines.forEach((line, index) => {
    const bounty = radar.detectBounty(line);
    console.log(`Processed bounty #${index}: ${bounty.type}`);
  });

  return radar.getStats();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { processStream, radar };
}

module.exports = { processStream, radar };