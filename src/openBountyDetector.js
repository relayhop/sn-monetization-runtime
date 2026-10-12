/**
 * openBountyDetector.js
 *
 * This module provides a lightweight parser that can read a single line
 * from the Stacker News bounty CSV export and return a structured object
 * when the bounty is in the `OPEN_BOUNTY` state.  The parser is tolerant
 * to missing columns and will simply return `null` if the line does not
 * contain the required fields or if the status is not `OPEN_BOUNTY`.
 *
 * The CSV format used
