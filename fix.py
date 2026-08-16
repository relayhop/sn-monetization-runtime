const processSNBounty = (rawInput) => {
  const parts = rawInput.trim().split(/\s+/);
  
  return {
    id: parts[0],
    network: parts[1],
    type: parts[2],
    amount: parts[3],
    price: parts[4],
    duration: parts[5],
    rate: parts[6],
    address: parts[7],
    count: parts[8],
    tags: parts[9],
    status: parts[10],
    description: parts[11]
  };
};

const rawLine = '1548616	bitcoin	1	674	1000	15	19.2	1208996	426	recent@bitcoin|top@bitcoin|recent@bitcoin_beginners	OPEN_BOUNTY	Asking 🤔 the stackers ⚡';

const result = processSNBounty(rawLine);

console.log(JSON.stringify(result, null, 2));
module.exports = { processSNBounty, result };