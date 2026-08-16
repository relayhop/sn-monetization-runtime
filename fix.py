const BountyManager = {
  id: '1548616',
  asset: 'bitcoin',
  title: 'recent@bitcoin',
  tags: ['recent@bitcoin', 'top@bitcoin', 'recent@bitcoin_beginners'],
  price: 21.7,
  volume: 1208996,
  quantity: 674,
  status: 'OPEN_BOUNTY',
  description: 'Asking 🤔 the stackers ⚡',
  
  init(data) {
    this.id = data.id || this.id;
    this.asset = data.asset || this.asset;
    this.price = data.price || this.price;
    this.volume = data.volume || this.volume;
    return this;
  },
  
  update(data) {
    if (data) {
      this.id = data.id || this.id;
      this.asset = data.asset || this.asset;
      this.price = data.price || this.price;
      this.volume = data.volume || this.volume;
    }
    return this;
  },
  
  getFormattedPrice() {
    return parseFloat(this.price).toFixed(2);
  },
  
  getFormattedVolume() {
    return parseInt(this.volume).toLocaleString();
  },
  
  getTotalValue() {
    return parseFloat(this.price) * parseInt(this.quantity);
  },
  
  toObject() {
    return {
      id: this.id,
      asset: this.asset,
      title: this.title,
      price: this.price,
      quantity: this.quantity,
      volume: this.volume,
      tags: this.tags,
      status: this.status,
      description: this.description
    };
  },
  
  toJSON() {
    return JSON.stringify(this.toObject(), null, 2);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BountyManager;
} else if (typeof window !== 'undefined') {
  window.BountyManager = BountyManager;
}