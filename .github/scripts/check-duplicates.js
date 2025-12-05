// .github/scripts/check-duplicates.js
// Detects duplicate URLs (same URL + same version)

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');

async function main() {
  const urlIndex = new Map(); // url -> [{ file, version }]

  const files = await glob('**/*.md', {
    cwd: SOURCES_DIR,
    ignore: ['**/README.md']
  });

  if (files.length === 0) {
    console.log('ℹ️  No documents found to check');
    process.exit(0);
  }

  console.log(`Checking ${files.length} documents for duplicates...\n`);

  for (const file of files) {
    const filePath = path.join(SOURCES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { data: frontmatter } = matter(content);

      if (frontmatter.url) {
        // Normalize URL
        let normalizedUrl;
        try {
          const url = new URL(frontmatter.url);
          url.search = '';
          url.hash = '';
          normalizedUrl = url.href.replace(/\/$/, '');
        } catch {
          // Invalid URL, skip
          console.warn(`  Warning: Invalid URL in ${file}`);
          continue;
        }

        if (!urlIndex.has(normalizedUrl)) {
          urlIndex.set(normalizedUrl, []);
        }

        urlIndex.get(normalizedUrl).push({
          file,
          version: frontmatter.version || 'latest',
        });
      }
    } catch (e) {
      console.warn(`  Warning: Could not parse ${file}: ${e.message}`);
    }
  }

  // Find duplicates (same URL + same version)
  const duplicates = [];

  for (const [url, entries] of urlIndex) {
    // Group by version
    const byVersion = new Map();

    for (const entry of entries) {
      const version = entry.version;
      if (!byVersion.has(version)) {
        byVersion.set(version, []);
      }
      byVersion.get(version).push(entry.file);
    }

    // Check for duplicates within same version
    for (const [version, fileList] of byVersion) {
      if (fileList.length > 1) {
        duplicates.push({ url, version, files: fileList });
      }
    }
  }

  // Also report same URL with different versions as informational
  const multiVersion = [];
  for (const [url, entries] of urlIndex) {
    const versions = new Set(entries.map(e => e.version));
    if (versions.size > 1) {
      multiVersion.push({
        url,
        versions: Array.from(versions),
        count: entries.length
      });
    }
  }

  if (duplicates.length > 0) {
    console.error('❌ Duplicate documents found (same URL + same version):\n');

    for (const dup of duplicates) {
      console.error(`  URL: ${dup.url}`);
      console.error(`  Version: ${dup.version}`);
      console.error(`  Files:`);
      for (const file of dup.files) {
        console.error(`    - ${file}`);
      }
      console.error('');
    }
  }

  if (multiVersion.length > 0) {
    console.log('ℹ️  Documents with multiple versions (this is OK):\n');

    for (const mv of multiVersion) {
      console.log(`  URL: ${mv.url}`);
      console.log(`  Versions: ${mv.versions.join(', ')}`);
      console.log('');
    }
  }

  // Summary
  console.log('─'.repeat(50));
  console.log(`Documents checked: ${files.length}`);
  console.log(`Unique URLs: ${urlIndex.size}`);
  console.log(`Duplicates (errors): ${duplicates.length}`);
  console.log(`Multi-version URLs: ${multiVersion.length}`);

  if (duplicates.length > 0) {
    process.exit(1);
  } else {
    console.log('\n✅ No duplicates found');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
