import * as fs from 'fs';

// Read entire stdin
const input = fs.readFileSync(0, 'utf8').trimEnd();

// If input is empty, nothing to do
if (input.length === 0) {
    process.exit(0);
}

// Split into lines (handle both \n and \r\n)
const lines = input.split(/\r?\n/);

const results: string[] = [];

for (const line of lines) {
    // Split by tab characters
    const parts = line.split('\t');
    // The title is the last field
    const title = parts[parts.length - 1];
    results.push(title);
}

// Output each title on its own line
process.stdout.write(results.join('\n'));