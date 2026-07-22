const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '../sn_opportunities/open_bounties.json');

/**
 * Stores processed OPEN_BOUNTY data
 * @param {Array} openBounties - Array of processed OPEN_BOUNTY objects
 */
function storeOpenBounties(openBounties) {
    try {
        // Read existing data if file exists
        let existingData = [];
        if (fs.existsSync(STORAGE_PATH)) {
            existingData = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
        }

        // Merge new data with existing data
        const mergedData = [...existingData, ...openBounties];

        // Write merged data back to file
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(mergedData, null, 2));
    } catch (error) {
        console.error('Error storing OPEN_BOUNTY data:', error);
        throw error;
    }
}

module.exports = { storeOpenBounties };