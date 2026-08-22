(() => {
  const solution = (() => {
    const BOUNTY_FILE = 'bountyData.txt';
    let bountyData = [];

    const normalizeBountyRow = (row) => {
      const parts = row.trim().split(/\t+/);
      
      if (parts.length < 10) return null;
      
      return {
        id: parseInt(parts[0], 10),
        name: parts[1],
        position: parts[2],
        number: parseInt(parts[3], 10),
        amount: parseInt(parts[4], 10),
        percent: parseInt(parts[5], 10),
        rate: parseFloat(parts[6]),
        address: parts[7],
        tags: parts[8].split('|'),
        status: parts[9],
        description: parts.slice(10).join('\t')
      };
    };

    const parseBountyCollection = (rawData) => {
      if (!rawData || rawData.length === 0) return [];
      
      bountyData = rawData.map(normalizeBountyRow).filter(Boolean);
      return bountyData;
    };

    const renderBountyCard = (bounty) => {
      if (!bounty) return '';
      
      return `
        <div class="bounty-card" data-id="${bounty.id}">
          <div class="card-header">
            <span class="bounty-name">${bounty.name}</span>
            <span class="bounty-status ${bounty.status === 'OPEN' ? 'open' : 'closed'}">${bounty.status}</span>
          </div>
          <div class="card-body">
            <p><span class="label">ID</span><span class="value">${bounty.id}</span></p>
            <p><span class="label">Position</span><span class="value">${bounty.position}</span></p>
            <p><span class="label">Number</span><span class="value">${bounty.number}</span></p>
            <p><span class="label">Amount</span><span class="value">${bounty.amount}</span></p>
            <p><span class="label">Percent</span><span class="value">${bounty.percent}</span></p>
            <p><span class="label">Rate</span><span class="value">${bounty.rate}%</span></p>
            <p><span class="label">Address</span><span class="value">${bounty.address}</span></p>
            <p><span class="label">Tags</span><span class="value">${bounty.tags.join(', ')}</span></p>
            <p><span class="label">Description</span><span class="value">${bounty.description}</span></p>
          </div>
        </div>
      `;
    };

    const renderAllBounties = () => {
      const container = document.getElementById('bounty-grid');
      if (!container || bountyData.length === 0) return;
      
      container.innerHTML = bountyData.map(renderBountyCard).join('');
    };

    const initUI = () => {
      const grid = document.createElement('div');
      grid.id = 'bounty-grid';
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;';
      
      grid.innerHTML = `
        <div class="bounty-header">
          <h2>Bounties</h2>
          <button id="refresh-btn">Refresh</button>
        </div>
      `;
      
      const container = document.getElementById('bounty-grid');
      container.appendChild(grid);
      
      const header = grid.querySelector('.bounty-header');
      const refreshBtn = grid.querySelector('#refresh-btn');
      
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          renderAllBounties();
        });
      }
    };

    const init = () => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
      } else {
        bootstrap();
      }
      
      const bootstrap = () => {
        const source = `1548616	bitcoin	1	674	1000	15	20.9	1208996	426	recent@bitcoin|top@bitcoin|recent@bitcoin_beginners	OPEN_BOUNTY	Asking 🤔 the stackers ⚡`;
        const row = parseBountyCollection([source])[0];
        
        if (row) {
          const container = document.getElementById('bounty-grid');
          container.innerHTML += renderBountyCard(row);
          
          const card = container.querySelector('.bounty-card');
          
          if (card && window.addEventListener) {
            window.addEventListener('resize', () => {
              container.innerHTML = '';
              renderAllBounties();
            });
          }
        }
      };
    };

    return init;
  })();

  window[solution] = solution;
})(solution_403);