// .github/scripts/find-stale.js
// Finds documents older than threshold

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');
const YAML = require('yaml');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');
const CONFIG_PATH = path.join(WORKSPACE, '.doclib/config.yaml');

async function main() {
  // Load config
  let staleDays = parseInt(process.env.STALE_DAYS || '180', 10);

  if (fs.existsSync(CONFIG_PATH)) {
    const config = YAML.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    staleDays = config.quality?.staleThresholdDays || staleDays;
  }

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - staleDays);

  console.log(`Finding documents older than ${staleDays} days...`);
  console.log(`Threshold date: ${staleThreshold.toISOString().slice(0, 10)}\n`);

  const staleDocuments = [];

  const files = await glob('**/*.md', {
    cwd: SOURCES_DIR,
    ignore: ['**/README.md']
  });

  for (const file of files) {
    const filePath = path.join(SOURCES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { data: frontmatter } = matter(content);

      if (frontmatter.capturedAt) {
        const capturedDate = new Date(frontmatter.capturedAt);

        if (capturedDate < staleThreshold) {
          const daysSinceCapture = Math.floor(
            (Date.now() - capturedDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          staleDocuments.push({
            file,
            title: frontmatter.title,
            url: frontmatter.url,
            capturedAt: frontmatter.capturedAt,
            daysSinceCapture,
            source: file.split('/')[0],
          });
        }
      }
    } catch {
      // Skip unparseable files
    }
  }

  // Sort by age (oldest first)
  staleDocuments.sort((a, b) => a.daysSinceCapture - b.daysSinceCapture).reverse();

  // Group by source
  const bySource = {};
  for (const doc of staleDocuments) {
    if (!bySource[doc.source]) {
      bySource[doc.source] = [];
    }
    bySource[doc.source].push(doc);
  }

  // Output report
  if (staleDocuments.length > 0) {
    console.log(`Found ${staleDocuments.length} stale documents:\n`);

    for (const [source, docs] of Object.entries(bySource)) {
      console.log(`\n## ${source} (${docs.length} documents)\n`);

      for (const doc of docs.slice(0, 10)) {  // Show top 10 per source
        console.log(`  - ${doc.file}`);
        console.log(`    Title: ${doc.title}`);
        console.log(`    Captured: ${doc.capturedAt.slice(0, 10)} (${doc.daysSinceCapture} days ago)`);
      }

      if (docs.length > 10) {
        console.log(`  ... and ${docs.length - 10} more`);
      }
    }

    // Generate markdown report
    const report = generateMarkdownReport(staleDocuments, bySource, staleDays);
    const reportPath = path.join(WORKSPACE, '.github/scripts/stale-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Report written to stale-report.md`);
  } else {
    console.log('✅ No stale documents found');
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log(`Documents checked: ${files.length}`);
  console.log(`Stale documents: ${staleDocuments.length}`);
  console.log(`Threshold: ${staleDays} days`);

  // Set outputs for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${staleDocuments.length}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `threshold=${staleDays}\n`);
  }
}

function generateMarkdownReport(staleDocuments, bySource, staleDays) {
  const lines = [
    '# Stale Documentation Report',
    '',
    `Found **${staleDocuments.length}** documents that haven't been updated in over **${staleDays} days**.`,
    '',
    '## Summary by Source',
    '',
    '| Source | Stale Documents |',
    '|--------|-----------------|',
  ];

  for (const [source, docs] of Object.entries(bySource)) {
    lines.push(`| ${source} | ${docs.length} |`);
  }

  lines.push('');

  for (const [source, docs] of Object.entries(bySource)) {
    lines.push(`## ${source}`);
    lines.push('');
    lines.push('| File | Title | Captured | Days Old |');
    lines.push('|------|-------|----------|----------|');

    for (const doc of docs.slice(0, 20)) {
      const shortFile = doc.file.length > 40 ? '...' + doc.file.slice(-37) : doc.file;
      const shortTitle = doc.title?.length > 30 ? doc.title.slice(0, 27) + '...' : doc.title || 'N/A';
      lines.push(`| ${shortFile} | ${shortTitle} | ${doc.capturedAt.slice(0, 10)} | ${doc.daysSinceCapture} |`);
    }

    if (docs.length > 20) {
      lines.push(`| ... | *${docs.length - 20} more documents* | | |`);
    }

    lines.push('');
  }

  lines.push('---');
  lines.push(`*Generated on ${new Date().toISOString().slice(0, 10)}*`);

  return lines.join('\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
