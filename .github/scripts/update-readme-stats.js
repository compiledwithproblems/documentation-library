// .github/scripts/update-readme-stats.js
// Updates the statistics section in README.md

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');
const README_PATH = path.join(WORKSPACE, 'README.md');

async function main() {
  // Gather statistics
  const stats = {};

  const sourceDirs = fs.readdirSync(SOURCES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const source of sourceDirs) {
    const sourceDir = path.join(SOURCES_DIR, source);

    const files = await glob('**/*.md', {
      cwd: sourceDir,
      ignore: ['**/README.md']
    });

    let latestDate = null;

    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const { data: frontmatter } = matter(content);

        if (frontmatter.capturedAt) {
          const date = new Date(frontmatter.capturedAt);
          if (!latestDate || date > latestDate) {
            latestDate = date;
          }
        }
      } catch {
        // Skip
      }
    }

    stats[source] = {
      count: files.length,
      lastUpdated: latestDate ? latestDate.toISOString().slice(0, 10) : '-',
    };
  }

  // Generate stats table
  const tableLines = [
    '| Source | Documents | Last Updated |',
    '|--------|-----------|--------------|',
  ];

  // Sort by document count (descending)
  const sortedSources = Object.entries(stats)
    .sort((a, b) => b[1].count - a[1].count);

  for (const [source, sourceStats] of sortedSources) {
    tableLines.push(`| ${source} | ${sourceStats.count} | ${sourceStats.lastUpdated} |`);
  }

  const statsTable = tableLines.join('\n');

  // Update README
  if (!fs.existsSync(README_PATH)) {
    console.log('README.md not found, skipping update');
    return;
  }

  let readme = fs.readFileSync(README_PATH, 'utf-8');

  // Find and replace stats section
  const statsStart = '<!-- STATS_START -->';
  const statsEnd = '<!-- STATS_END -->';

  const startIndex = readme.indexOf(statsStart);
  const endIndex = readme.indexOf(statsEnd);

  if (startIndex === -1 || endIndex === -1) {
    console.log('Stats markers not found in README.md, skipping update');
    return;
  }

  const before = readme.slice(0, startIndex + statsStart.length);
  const after = readme.slice(endIndex);

  readme = `${before}\n${statsTable}\n${after}`;

  fs.writeFileSync(README_PATH, readme);

  // Summary
  const totalDocs = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
  console.log(`✅ Updated README.md with statistics`);
  console.log(`   Total documents: ${totalDocs}`);
  console.log(`   Sources: ${sourceDirs.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
