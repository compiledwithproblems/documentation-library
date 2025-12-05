# Contributing to documentation-library

Thank you for your interest in contributing to the documentation library!

## Ways to Contribute

- **Add documentation** via the browser extension or manually
- **Report issues** with existing documentation
- **Request new sources** for documentation capture
- **Improve automation** scripts and workflows

## Adding Documentation

### Via Browser Extension (Recommended)

The easiest way to add documentation:

1. Install [doc-capture-extension](https://github.com/btate/doc-capture-extension)
2. Configure with this repository
3. Navigate to a documentation page
4. Click the extension and push

The extension handles:
- Extracting content and metadata
- Generating proper file paths
- Creating valid frontmatter
- Committing to this repository

### Manually

For manual additions:

1. Fork this repository
2. Create a new branch: `git checkout -b add-docs/description`
3. Add your document under `sources/{source}/`
4. Ensure frontmatter includes required fields
5. Run local validation (see below)
6. Submit a pull request

## Document Requirements

### Required Frontmatter

Every document must have:

```yaml
---
title: Document Title
url: https://source-url.com/path
capturedAt: 2024-12-05T10:30:00.000Z
---
```

### Recommended Frontmatter

For better organization and searchability:

```yaml
---
title: Document Title
url: https://source-url.com/path
capturedAt: 2024-12-05T10:30:00.000Z
breadcrumb:
  - Category
  - Subcategory
  - Document Title
version: "18"
language: typescript
source: react
tags:
  - hooks
  - state-management
---
```

### Content Guidelines

- **Minimum length:** 100 characters (excluding frontmatter)
- **Maximum file size:** 1MB
- **Format:** Markdown with proper heading hierarchy
- **Code blocks:** Use fenced code blocks with language identifiers

## Path Conventions

### Rules

- All lowercase letters and numbers
- Words separated by hyphens (`-`)
- No special characters or spaces
- No consecutive hyphens (`--`)
- Maximum 6 directory levels

### Examples

| Good | Bad |
|------|-----|
| `sources/apple/swiftui/views/text.md` | `sources/Apple/SwiftUI/Views/Text.md` |
| `sources/react/hooks/use-state.md` | `sources/react/hooks/useState.md` |
| `sources/mdn/javascript/array-map.md` | `sources/mdn/JavaScript/Array.map.md` |

### Path Structure

```
sources/{source}/{category}/[{subcategory}/...]{slug}.md
```

- `{source}` — Registered source name (apple, react, etc.)
- `{category}` — Primary category from breadcrumb
- `{subcategory}` — Optional sub-categories
- `{slug}` — Document filename (without extension)

## Adding a New Source

To add support for a new documentation source:

1. **Open an issue** using the "New Source" template
2. **Provide information:**
   - Source name and website
   - Domain(s) to map
   - Versioning strategy
   - Primary languages
3. **Wait for approval** from maintainers
4. **Create the source:**
   - Add folder: `sources/{source}/`
   - Add config: `sources/{source}/.source.yaml`
   - Add entry to `.doclib/sources.yaml`
5. **Submit PR** with the new source configuration

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd .github/scripts
npm install
```

### Running Validation

```bash
# Individual checks
npm run validate    # Frontmatter validation
npm run duplicates  # Duplicate detection
npm run paths       # Path validation
npm run sources     # Source registration

# All checks
npm run all

# Other utilities
npm run fix         # Auto-fix common issues
npm run stats       # Generate statistics
npm run stale       # Find stale documents
```

### Testing Changes

Before submitting a PR:

1. Run all validation: `npm run all`
2. Fix any errors reported
3. Run auto-fix if needed: `npm run fix`
4. Re-run validation to confirm

## Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** following the guidelines above
3. **Run local validation** to catch issues early
4. **Submit PR** with a clear description
5. **Wait for CI** — automated checks will run
6. **Address feedback** from reviewers
7. **Merge** once approved

### PR Title Convention

- `docs: add {source} {topic}` — Adding documentation
- `fix: {description}` — Fixing issues
- `feat: {description}` — New features/sources
- `chore: {description}` — Maintenance tasks

## Code of Conduct

- Be respectful and constructive
- Focus on improving documentation quality
- Help others learn and contribute

## Questions?

- Open an issue for questions
- Check existing issues for answers
- Review the [README](README.md) for general information

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
