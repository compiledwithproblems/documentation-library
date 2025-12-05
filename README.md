# documentation-library

A structured repository of technical documentation for use with RAG pipelines.

## Overview

`documentation-library` is the central storage layer for captured technical documentation. It serves as the bridge between:

- **[doc-capture-extension](https://github.com/btate/doc-capture-extension)** — Browser extension that captures documentation
- **[documentation-domain-api](https://github.com/btate/documentation-domain-api)** — RAG pipeline that indexes and serves documentation

## Structure

```text
sources/
├── apple/          # Apple Developer Documentation
├── react/          # React Documentation
├── cloudflare/     # Cloudflare Documentation
├── typescript/     # TypeScript Documentation
└── mdn/            # MDN Web Docs
```

## How It Works

1. **Capture** — Use the browser extension to capture documentation pages
2. **Store** — Extension commits Markdown files to this repository
3. **Validate** — GitHub Actions validate structure and content
4. **Index** — RAG pipeline indexes the content for search
5. **Query** — Search via API or MCP tools

## Document Format

Each document includes YAML frontmatter:

```yaml
---
title: Text
url: https://developer.apple.com/documentation/swiftui/text
breadcrumb:
  - SwiftUI
  - Views
  - Text
version: iOS 18
language: swift
source: apple
capturedAt: 2024-12-05T10:30:00Z
---
```

### Required Fields

| Field | Description |
|-------|-------------|
| `title` | Document title |
| `url` | Original source URL |
| `capturedAt` | ISO 8601 timestamp of capture |

### Optional Fields

| Field | Description |
|-------|-------------|
| `breadcrumb` | Navigation path array |
| `version` | Version identifier (e.g., "iOS 18", "19") |
| `language` | Primary programming language |
| `source` | Source identifier |
| `tags` | Categorization tags |

## Statistics

<!-- STATS_START -->
| Source | Documents | Last Updated |
|--------|-----------|--------------|
| apple | 0 | - |
| react | 0 | - |
| cloudflare | 0 | - |
| typescript | 0 | - |
| mdn | 0 | - |
<!-- STATS_END -->

Updated automatically on merge.

## Automation

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **Validate** | Push/PR | Validates frontmatter, paths, duplicates, sources |
| **Notify Pipeline** | Push to main | Notifies RAG pipeline of changes |
| **Update Stats** | Push to main, Weekly | Updates document statistics |
| **Stale Check** | Monthly | Reports outdated documentation |
| **Auto-Organize** | PR | Auto-fixes common formatting issues |

## Adding Documentation

### Via Browser Extension (Recommended)

1. Install the [doc-capture-extension](https://github.com/btate/doc-capture-extension)
2. Configure with this repository
3. Navigate to a documentation page
4. Click extension and push to this repo

### Manually

1. Create file: `sources/{source}/{path}/{slug}.md`
2. Add required frontmatter (see format above)
3. Submit PR

### Path Conventions

- All lowercase
- Hyphens for word separation
- No special characters
- Maximum 6 levels deep

**Good:** `sources/apple/swiftui/views/text.md`
**Bad:** `sources/Apple/SwiftUI/Views/Text.md`

## Configuration

- **Global config:** [.doclib/config.yaml](.doclib/config.yaml)
- **Source registry:** [.doclib/sources.yaml](.doclib/sources.yaml)
- **Frontmatter schema:** [.doclib/schemas/frontmatter.schema.json](.doclib/schemas/frontmatter.schema.json)

## Adding a New Source

1. Open an issue using the "New Source" template
2. Once approved, create:
   - `sources/{source}/.source.yaml` (use [template](templates/source.yaml))
   - Entry in `.doclib/sources.yaml`
3. Submit PR

## Development

### Running Validation Locally

```bash
cd .github/scripts
npm install
npm run validate    # Validate frontmatter
npm run duplicates  # Check for duplicates
npm run paths       # Validate paths
npm run sources     # Check source registration
npm run all         # Run all checks
```

### Required Secrets

For pipeline integration, set these repository secrets:

| Secret | Description |
|--------|-------------|
| `PIPELINE_WEBHOOK_URL` | RAG pipeline webhook endpoint |
| `PIPELINE_API_KEY` | API key for webhook authentication |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE)
