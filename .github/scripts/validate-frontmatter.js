// .github/scripts/validate-frontmatter.js
// Validates all document frontmatter against JSON schema

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { glob } = require('glob');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const WORKSPACE = process.env.GITHUB_WORKSPACE || path.resolve(__dirname, '../..');
const SOURCES_DIR = path.join(WORKSPACE, 'sources');
const SCHEMA_PATH = path.join(WORKSPACE, '.doclib/schemas/frontmatter.schema.json');

async function main() {
  // Load schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`❌ Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

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

  console.log(`Validating ${files.length} documents...\n`);

  for (const file of files) {
    const filePath = path.join(SOURCES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { data: frontmatter, content: body } = matter(content);

      // Check if frontmatter exists
      if (Object.keys(frontmatter).length === 0) {
        errors.push({
          file,
          message: 'No frontmatter found',
        });
        continue;
      }

      // Validate against schema
      const valid = validate(frontmatter);

      if (!valid) {
        for (const error of validate.errors) {
          errors.push({
            file,
            field: error.instancePath || error.params?.missingProperty,
            message: error.message,
          });
        }
      }

      // Additional validations

      // Check content length
      const contentLength = body.trim().length;
      if (contentLength < 100) {
        warnings.push({
          file,
          message: `Content is very short (${contentLength} characters, minimum 100)`,
        });
      }

      // Check for future capturedAt dates
      if (frontmatter.capturedAt) {
        const capturedDate = new Date(frontmatter.capturedAt);
        if (capturedDate > new Date()) {
          errors.push({
            file,
            field: 'capturedAt',
            message: 'capturedAt date is in the future',
          });
        }
      }

      // Check URL format
      if (frontmatter.url) {
        try {
          new URL(frontmatter.url);
        } catch {
          errors.push({
            file,
            field: 'url',
            message: 'Invalid URL format',
          });
        }
      }

    } catch (e) {
      errors.push({
        file,
        message: `Failed to parse: ${e.message}`,
      });
    }
  }

  // Output results
  if (errors.length > 0) {
    console.error('❌ Validation Errors:\n');
    for (const error of errors) {
      console.error(`  ${error.file}`);
      console.error(`    ${error.field ? `[${error.field}] ` : ''}${error.message}\n`);
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
  console.log(`Documents scanned: ${files.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length === 0) {
    console.log(`\n✅ All ${files.length} documents passed validation`);
    process.exit(0);
  } else {
    console.error(`\n❌ ${errors.length} errors found`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
