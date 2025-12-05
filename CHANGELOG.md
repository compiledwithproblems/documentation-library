# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Initial repository setup for documentation-library
- Base configuration files:
  - `.gitignore` for ignoring dependencies, OS files, and build outputs
  - `.editorconfig` for consistent editor settings
  - `LICENSE` (MIT)
- Documentation library configuration in `.doclib/`:
  - `config.yaml` - Global configuration for frontmatter, paths, quality thresholds, and integrations
  - `sources.yaml` - Source registry with domain mappings for Apple, React, Cloudflare, TypeScript, and MDN
  - `schemas/frontmatter.schema.json` - JSON Schema for document frontmatter validation
  - `schemas/source.schema.json` - JSON Schema for .source.yaml validation
- Source directories with configuration:
  - `sources/apple/.source.yaml` - Apple Developer Documentation
  - `sources/react/.source.yaml` - React Documentation
  - `sources/cloudflare/.source.yaml` - Cloudflare Documentation
  - `sources/typescript/.source.yaml` - TypeScript Documentation
  - `sources/mdn/.source.yaml` - MDN Web Docs
- Validation scripts in `.github/scripts/`:
  - `validate-frontmatter.js` - Validates document frontmatter against JSON Schema
  - `check-duplicates.js` - Detects duplicate URLs within same version
  - `validate-paths.js` - Ensures paths follow naming conventions
  - `check-sources.js` - Verifies all sources are registered
  - `auto-fix.js` - Auto-fixes common formatting issues
  - `generate-stats.js` - Generates statistics for each source
  - `find-stale.js` - Finds documents older than threshold
  - `update-readme-stats.js` - Updates statistics in README.md
- GitHub Actions workflows:
  - `validate.yml` - Validates documentation on push/PR
  - `notify-pipeline.yml` - Triggers RAG pipeline ingest via direct API call
  - `update-stats.yml` - Updates statistics on merge and weekly
  - `stale-check.yml` - Monthly check for stale documents
  - `auto-organize.yml` - Auto-fixes issues in PRs

### Changed

- Replaced webhook-based pipeline notification with direct API call to `/ingest` endpoint
- Updated secrets from `PIPELINE_WEBHOOK_URL` to `PIPELINE_API_URL` for clearer naming
- Pipeline integration now triggers incremental ingest per affected source

### Added (continued)

- Issue templates:
  - `new-source.md` - Request new documentation source
  - `stale-report.md` - Report stale documentation
  - `bug-report.md` - Report bugs
- `CODEOWNERS` file for code ownership
- Templates directory:
  - `document.md` - Template for new documents
  - `source.yaml` - Template for new source configuration
- Comprehensive documentation:
  - `README.md` - Project overview, usage, and configuration
  - `CONTRIBUTING.md` - Contribution guidelines
  - `TECH-SPECS.md` - Complete technical specification
