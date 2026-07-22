const fs = require('fs');
const path = require('path');
const { processOpenBountyData } = require('../data/processors/openBountyProcessor');
const { storeOpenBounties } = require('../data/storage/openBountyStorage');

const INPUT_PATH = path.join(__dirname, '../data/sn_opportunities/sn_latest.tsv');

/**
 * Main function to process and store OPEN_BOUNTY data
 */
async function main() {
    try {
        // Read input file
        const rawData = fs.readFileSync(INPUT_PATH, 'utf8');

        // Process the data
        const processedData = processOpenBountyData(rawData);

        // Store the processed data
        storeOpenBounties(processedData);

        console.log('Successfully processed and stored OPEN_BOUNTY data');
    } catch (error) {
        console.error('Error in OPEN_BOUNTY processing pipeline:', error);
        process.exit(1);
    }
}

// Run the script
main();