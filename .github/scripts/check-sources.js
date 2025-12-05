// .github/scripts/check-sources.js
// Verifies all documents are in registered sources

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');
const YAML = require('yaml');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');
const SOURCES_YAML = path.join(WORKSPACE, '.doclib/sources.yaml');

async function main() {
  // Load registered sources
  if (!fs.existsSync(SOURCES_YAML)) {
    console.error(`❌ Sources registry not found: ${SOURCES_YAML}`);
    process.exit(1);
  }

  const sourcesConfig = YAML.parse(fs.readFileSync(SOURCES_YAML, 'utf-8'));
  const registeredSources = new Set(Object.keys(sourcesConfig.sources || {}));
  const domainMapping = sourcesConfig.domainMapping || {};

  const errors = [];
  const warnings = [];

  // Find all source directories
  const sourceDirs = fs.readdirSync(SOURCES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Registered sources: ${Array.from(registeredSources).join(', ')}`);
  console.log(`Found directories: ${sourceDirs.join(', ')}\n`);

  // Check for unregistered source directories
  for (const dir of sourceDirs) {
    if (!registeredSources.has(dir)) {
      errors.push({
        type: 'unregistered-directory',
        message: `Directory "sources/${dir}" is not registered in sources.yaml`,
      });
    }

    // Check for .source.yaml in each directory
    const sourceYamlPath = path.join(SOURCES_DIR, dir, '.source.yaml');
    if (!fs.existsSync(sourceYamlPath)) {
      warnings.push({
        type: 'missing-source-yaml',
        message: `Directory "sources/${dir}" is missing .source.yaml`,
      });
    }
  }

  // Check for registered sources without directories
  for (const source of registeredSources) {
    const sourceDir = path.join(SOURCES_DIR, source);
    if (!fs.existsSync(sourceDir)) {
      warnings.push({
        type: 'missing-directory',
        message: `Registered source "${source}" has no directory`,
      });
    }
  }

  // Find all documents and check their source fields
  const files = await glob('**/*.md', {
    cwd: SOURCES_DIR,
    ignore: ['**/README.md']
  });

  for (const file of files) {
    const filePath = path.join(SOURCES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFromPath = file.split('/')[0];

    try {
      const { data: frontmatter } = matter(content);

      // Check if source field matches directory
      if (frontmatter.source && frontmatter.source !== sourceFromPath) {
        warnings.push({
          type: 'source-mismatch',
          file,
          message: `Source field "${frontmatter.source}" doesn't match directory "${sourceFromPath}"`,
        });
      }

      // Check if URL domain matches source
      if (frontmatter.url) {
        try {
          const url = new URL(frontmatter.url);
          const expectedSource = domainMapping[url.hostname];

          if (expectedSource && expectedSource !== sourceFromPath) {
            warnings.push({
              type: 'domain-mismatch',
              file,
              message: `URL domain "${url.hostname}" maps to "${expectedSource}" but file is in "${sourceFromPath}"`,
            });
          }
        } catch {
          // Invalid URL, already caught by frontmatter validation
        }
      }
    } catch (e) {
      // Parse error, already caught by frontmatter validation
    }
  }

  // Output results
  if (errors.length > 0) {
    console.error('❌ Source Registration Errors:\n');
    for (const error of errors) {
      console.error(`  [${error.type}]`);
      if (error.file) console.error(`  File: ${error.file}`);
      console.error(`  ${error.message}\n`);
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    for (const warning of warnings) {
      console.warn(`  [${warning.type}]`);
      if (warning.file) console.warn(`  File: ${warning.file}`);
      console.warn(`  ${warning.message}\n`);
    }
  }

  // Summary
  console.log('─'.repeat(50));
  console.log(`Registered sources: ${registeredSources.size}`);
  console.log(`Source directories: ${sourceDirs.length}`);
  console.log(`Documents checked: ${files.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length === 0) {
    console.log(`\n✅ All sources are properly registered`);
    process.exit(0);
  } else {
    console.error(`\n❌ ${errors.length} source registration errors found`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
