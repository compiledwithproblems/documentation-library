// .github/scripts/generate-stats.js
// Generates statistics for each source

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');
const YAML = require('yaml');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');

async function main() {
  const stats = {};

  // Find all source directories
  const sourceDirs = fs.readdirSync(SOURCES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Generating statistics for ${sourceDirs.length} sources...\n`);

  for (const source of sourceDirs) {
    const sourceDir = path.join(SOURCES_DIR, source);
    const sourceYamlPath = path.join(sourceDir, '.source.yaml');

    // Find all documents in this source
    const files = await glob('**/*.md', {
      cwd: sourceDir,
      ignore: ['**/README.md']
    });

    // Collect stats
    let latestCapturedAt = null;
    const versions = new Set();
    const languages = new Set();

    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const { data: frontmatter } = matter(content);

        if (frontmatter.capturedAt) {
          const date = new Date(frontmatter.capturedAt);
          if (!latestCapturedAt || date > latestCapturedAt) {
            latestCapturedAt = date;
          }
        }

        if (frontmatter.version) {
          versions.add(frontmatter.version);
        }

        if (frontmatter.language) {
          languages.add(frontmatter.language);
        }
      } catch {
        // Skip unparseable files
      }
    }

    stats[source] = {
      documentCount: files.length,
      lastCapturedAt: latestCapturedAt ? latestCapturedAt.toISOString() : null,
      versions: Array.from(versions).sort(),
      languages: Array.from(languages).sort(),
    };

    // Update .source.yaml
    if (fs.existsSync(sourceYamlPath)) {
      try {
        const sourceYaml = YAML.parse(fs.readFileSync(sourceYamlPath, 'utf-8'));

        sourceYaml.stats = {
          documentCount: files.length,
          lastUpdated: new Date().toISOString(),
          lastCapturedAt: latestCapturedAt ? latestCapturedAt.toISOString() : null,
          topContributors: sourceYaml.stats?.topContributors || [],
        };

        fs.writeFileSync(sourceYamlPath, YAML.stringify(sourceYaml));
        console.log(`  ✓ Updated ${source}/.source.yaml`);
      } catch (e) {
        console.warn(`  ⚠ Could not update ${source}/.source.yaml: ${e.message}`);
      }
    }

    console.log(`  ${source}: ${files.length} documents`);
  }

  // Output summary
  console.log('\n' + '─'.repeat(50));
  console.log('Statistics Summary:\n');

  const totalDocs = Object.values(stats).reduce((sum, s) => sum + s.documentCount, 0);
  console.log(`Total documents: ${totalDocs}`);
  console.log('\nBy source:');

  for (const [source, sourceStats] of Object.entries(stats)) {
    console.log(`  ${source}: ${sourceStats.documentCount} docs`);
    if (sourceStats.versions.length > 0) {
      console.log(`    Versions: ${sourceStats.versions.join(', ')}`);
    }
  }

  // Write stats JSON for other tools
  const statsPath = path.join(WORKSPACE, '.github/scripts/stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  console.log(`\n✅ Statistics written to stats.json`);

  // Set outputs for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `total=${totalDocs}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `sources=${sourceDirs.length}\n`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
