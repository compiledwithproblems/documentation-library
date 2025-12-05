// .github/scripts/auto-fix.js
// Auto-fixes common issues in documentation files

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');

async function main() {
  const fixes = [];

  const files = await glob('**/*.md', {
    cwd: SOURCES_DIR,
    ignore: ['**/README.md']
  });

  if (files.length === 0) {
    console.log('ℹ️  No documents found to process');
    process.exit(0);
  }

  console.log(`Scanning ${files.length} documents for fixable issues...\n`);

  for (const file of files) {
    const filePath = path.join(SOURCES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { data: frontmatter, content: body } = matter(content);
      let modified = false;
      const fileFixes = [];

      // Fix 1: Normalize capturedAt to ISO string
      if (frontmatter.capturedAt instanceof Date) {
        frontmatter.capturedAt = frontmatter.capturedAt.toISOString();
        fileFixes.push('Converted capturedAt to ISO string');
        modified = true;
      }

      // Fix 2: Remove trailing slash from URL
      if (frontmatter.url && frontmatter.url.endsWith('/')) {
        frontmatter.url = frontmatter.url.slice(0, -1);
        fileFixes.push('Removed trailing slash from URL');
        modified = true;
      }

      // Fix 3: Normalize URL (remove query params and hash for consistency)
      if (frontmatter.url) {
        try {
          const url = new URL(frontmatter.url);
          // Only normalize if there are query params or hash
          if (url.search || url.hash) {
            const normalizedUrl = `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, '');
            if (normalizedUrl !== frontmatter.url) {
              frontmatter.url = normalizedUrl;
              fileFixes.push('Normalized URL (removed query/hash)');
              modified = true;
            }
          }
        } catch {
          // Invalid URL, skip
        }
      }

      // Fix 4: Convert breadcrumb string to array
      if (frontmatter.breadcrumb && typeof frontmatter.breadcrumb === 'string') {
        frontmatter.breadcrumb = frontmatter.breadcrumb
          .split(/[>→|\/]/)
          .map(s => s.trim())
          .filter(Boolean);
        fileFixes.push('Converted breadcrumb to array');
        modified = true;
      }

      // Fix 5: Add source field if missing
      if (!frontmatter.source) {
        const source = file.split('/')[0];
        frontmatter.source = source;
        fileFixes.push(`Added source: ${source}`);
        modified = true;
      }

      // Fix 6: Normalize version "latest"
      if (frontmatter.version === '' || frontmatter.version === null) {
        frontmatter.version = 'latest';
        fileFixes.push('Set version to "latest"');
        modified = true;
      }

      // Fix 7: Remove empty optional fields
      const optionalFields = ['lastModified', 'tags', 'language'];
      for (const field of optionalFields) {
        if (frontmatter[field] === '' || frontmatter[field] === null) {
          delete frontmatter[field];
          fileFixes.push(`Removed empty ${field}`);
          modified = true;
        }
        // Also remove empty arrays
        if (Array.isArray(frontmatter[field]) && frontmatter[field].length === 0) {
          delete frontmatter[field];
          fileFixes.push(`Removed empty ${field} array`);
          modified = true;
        }
      }

      // Fix 8: Trim whitespace from title
      if (frontmatter.title && frontmatter.title !== frontmatter.title.trim()) {
        frontmatter.title = frontmatter.title.trim();
        fileFixes.push('Trimmed whitespace from title');
        modified = true;
      }

      // Fix 9: Normalize tags to lowercase
      if (Array.isArray(frontmatter.tags)) {
        const normalizedTags = frontmatter.tags.map(tag =>
          tag.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-')
        );
        if (JSON.stringify(normalizedTags) !== JSON.stringify(frontmatter.tags)) {
          frontmatter.tags = normalizedTags;
          fileFixes.push('Normalized tags to lowercase');
          modified = true;
        }
      }

      // Fix 10: Ensure lastModified is ISO format if present
      if (frontmatter.lastModified instanceof Date) {
        frontmatter.lastModified = frontmatter.lastModified.toISOString();
        fileFixes.push('Converted lastModified to ISO string');
        modified = true;
      }

      if (modified) {
        const newContent = matter.stringify(body, frontmatter);
        fs.writeFileSync(filePath, newContent);
        fixes.push({ file, fixes: fileFixes });
        console.log(`  ✓ Fixed: ${file}`);
        fileFixes.forEach(f => console.log(`    - ${f}`));
      }

    } catch (e) {
      console.warn(`  ⚠ Could not process ${file}: ${e.message}`);
    }
  }

  // Summary
  const totalFixes = fixes.reduce((sum, f) => sum + f.fixes.length, 0);
  const summary = fixes.map(f => `- ${f.file}: ${f.fixes.join(', ')}`).join('\n');

  console.log('\n' + '─'.repeat(50));
  console.log(`Files processed: ${files.length}`);
  console.log(`Files fixed: ${fixes.length}`);
  console.log(`Total fixes: ${totalFixes}`);

  // Set outputs for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `fixed=${totalFixes}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `files=${fixes.length}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary<<EOF\n${summary || 'No fixes needed'}\nEOF\n`);
  }

  if (totalFixes > 0) {
    console.log(`\n✅ Applied ${totalFixes} fixes to ${fixes.length} files`);
  } else {
    console.log('\n✅ No fixes needed');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
