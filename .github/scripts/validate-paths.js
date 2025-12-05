// .github/scripts/validate-paths.js
// Validates that file paths follow conventions

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const YAML = require('yaml');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');
const CONFIG_PATH = path.join(WORKSPACE, '.doclib/config.yaml');

async function main() {
  // Load config
  let config = {
    paths: {
      maxDepth: 6,
      slugPattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      reserved: ['.source.yaml', '.git', 'node_modules', 'README.md']
    }
  };

  if (fs.existsSync(CONFIG_PATH)) {
    config = YAML.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }

  const slugRegex = new RegExp(config.paths.slugPattern);
  const maxDepth = config.paths.maxDepth;
  const reserved = config.paths.reserved;

  const errors = [];
  const warnings = [];

  // Find all markdown files
  const files = await glob('**/*.md', {
    cwd: SOURCES_DIR,
    ignore: ['**/README.md']
  });

  if (files.length === 0) {
    console.log('ℹ️  No documents found to validate');
    process.exit(0);
  }

  console.log(`Validating paths for ${files.length} documents...\n`);

  for (const file of files) {
    const parts = file.split('/');
    const filename = parts.pop();
    const directories = parts;

    // Check depth
    if (directories.length > maxDepth) {
      errors.push({
        file,
        message: `Path too deep (${directories.length} levels, max ${maxDepth})`,
      });
    }

    // Check filename slug (without extension)
    const slug = filename.replace(/\.md$/, '');
    if (!slugRegex.test(slug)) {
      errors.push({
        file,
        message: `Invalid filename slug "${slug}" - must match pattern ${config.paths.slugPattern}`,
      });
    }

    // Check directory names
    for (const dir of directories) {
      // Skip source directory (first level)
      if (directories.indexOf(dir) === 0) continue;

      if (!slugRegex.test(dir)) {
        errors.push({
          file,
          message: `Invalid directory name "${dir}" - must match pattern ${config.paths.slugPattern}`,
        });
      }
    }

    // Check for reserved names
    for (const part of [...directories, filename]) {
      if (reserved.includes(part)) {
        errors.push({
          file,
          message: `Reserved name "${part}" cannot be used`,
        });
      }
    }

    // Check for uppercase letters
    if (file !== file.toLowerCase()) {
      errors.push({
        file,
        message: 'Path contains uppercase letters - all paths must be lowercase',
      });
    }

    // Check for special characters
    if (/[^a-z0-9\-\/\.]/.test(file)) {
      errors.push({
        file,
        message: 'Path contains invalid characters - only lowercase letters, numbers, hyphens allowed',
      });
    }

    // Check for consecutive hyphens
    if (/--/.test(file)) {
      warnings.push({
        file,
        message: 'Path contains consecutive hyphens',
      });
    }
  }

  // Output results
  if (errors.length > 0) {
    console.error('❌ Path Validation Errors:\n');
    for (const error of errors) {
      console.error(`  ${error.file}`);
      console.error(`    ${error.message}\n`);
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    for (const warning of warnings) {
      console.warn(`  ${warning.file}`);
      console.warn(`    ${warning.message}\n`);
    }
  }

  // Summary
  console.log('─'.repeat(50));
  console.log(`Paths checked: ${files.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length === 0) {
    console.log(`\n✅ All paths are valid`);
    process.exit(0);
  } else {
    console.error(`\n❌ ${errors.length} path errors found`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
