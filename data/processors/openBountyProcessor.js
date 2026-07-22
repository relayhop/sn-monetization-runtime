const { parse } = require('csv-parse/sync');

/**
 * Processes raw OPEN_BOUNTY data from the provided format
 * @param {string} rawData - Raw data string in the specified format
 * @returns {Array} - Array of parsed OPEN_BOUNTY objects
 */
function processOpenBountyData(rawData) {
    try {
        // Parse the raw data into an array of objects
        const records = parse(rawData, {
            delimiter: '\t',
            columns: [
                'id',
                'category',
                'type',
                'points',
                'max_points',
                'level',
                'completion_percentage',
                'parent_id',
                'flags',
                'authors',
                'tags',
                'description'
            ],
            skip_empty_lines: true
        });

        // Validate required fields
        return records.map(record => {
            if (!record.id || !record.description) {
                throw new Error('Missing required fields in OPEN_BOUNTY data');
            }
            return {
                id: record.id,
                category: record.category,
                type: record.type,
                points: parseInt(record.points),
                maxPoints: parseInt(record.max_points),
                level: parseInt(record.level),
                completionPercentage: parseFloat(record.completion_percentage),
                parentId: record.parent_id,
                flags: record.flags.split(','),
                authors: record.authors.split('|'),
                tags: record.tags.split(','),
                description: record.description
            };
        });
    } catch (error) {
        console.error('Error processing OPEN_BOUNTY data:', error);
        throw error;
    }
}

module.exports = { processOpenBountyData };