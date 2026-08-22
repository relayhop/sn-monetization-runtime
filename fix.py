const solution_398 = (() => {
  'use strict';

  class SNOpenBounty {
    /**
     * Parses the raw bounty row structure:
     * Index | Token | Qty | Price | Amt | Pct | CurPrice | Score | Weight | Tags | Type | Desc
     */
    parse(row) {
      if (!row || typeof row !== 'string') return row;

      // Split by comma (standard delimiter)
      const cols = row.split(',');

      // Ensure the specific 12-column structure is respected
      if (cols.length < 12) {
        return cols; // Fallback to raw array if short
      }

      return {
        index: parseInt(cols[0], 10),
        token: cols[1],
        quantity: cols[2],
        price: cols[3],
        amount: cols[4],
        pct: cols[5],
        curPrice: cols[6],
        score: parseInt(cols[7], 10),
        weight: parseInt(cols[8], 10),
        tags: cols[9],       // Contains pipe-delimited tags
        type: cols[10],
        description: cols[11] // Contains emojis and spaces
      };
    }

    /**
     * Loads a raw string row and returns the parsed object
     */
    load(row) {
      const obj = this.parse(row);
      if (obj) this.rowCount++;
      return obj;
    }

    /**
     * Helper to split the pipe-delimited tags for easier iteration
     */
    getTagList(row) {
      const p = this.parse(row);
      if (!p.tags) return [];
      return p.tags.split('|').map(t => t.trim());
    }

    get rowCount() {
      return this._rowCount || 0;
    }

    set _rowCount(val) {
      this._rowCount = val;
    }
  }

  // Initialize with the instance
  const instance = new SNOpenBounty();

  // Return the instance for method chaining
  return instance;
})();

// Export for module bundlers
export default solution_398;