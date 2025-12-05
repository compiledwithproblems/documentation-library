# documentation-library

## Technical Specification

---

## 1. Project Overview

### Purpose

`documentation-library` is a structured GitHub repository that serves as the central storage layer for captured technical documentation. It acts as the bridge between the `doc-capture-extension` (which captures and commits documentation) and the `documentation-domain-api` (which indexes and serves the documentation via RAG).

### Role in the System

```
┌─────────────────────────────────────────────────────────────────┐
│                    doc-capture-extension                        │
│                    (Browser Extension)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Commits Markdown files via GitHub API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   documentation-library                         │
│                   (This Repository)                             │
│                                                                 │
│   • Stores documentation as Markdown with frontmatter           │
│   • Organizes by source (apple/, react/, cloudflare/)           │
│   • Validates structure via GitHub Actions                      │
│   • Notifies pipeline on changes                                │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Pipeline fetches via GitHub API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  documentation-domain-api                       │
│                  (RAG Pipeline)                                 │
│                                                                 │
│   Fetches → Parses Frontmatter → Chunks → Embeds → Stores      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Convention over configuration** — Predictable structure reduces complexity
2. **Git as the source of truth** — Full history, branching, collaboration
3. **Human-readable** — Markdown files can be browsed directly on GitHub
4. **Machine-parseable** — Consistent frontmatter for automated processing
5. **Self-documenting** — Configuration files describe the structure
6. **Automated quality** — GitHub Actions enforce standards

---

## 2. Repository Structure

### Complete Directory Layout

```
documentation-library/
├── .github/
│   ├── workflows/
│   │   ├── validate.yml              # Validate PRs and pushes
│   │   ├── notify-pipeline.yml       # Trigger RAG pipeline on changes
│   │   ├── update-stats.yml          # Update source statistics
│   │   ├── stale-check.yml           # Monthly stale document report
│   │   └── auto-organize.yml         # Auto-fix common issues
│   │
│   ├── scripts/
│   │   ├── package.json              # Dependencies for validation scripts
│   │   ├── validate-frontmatter.js   # Frontmatter validation
│   │   ├── check-duplicates.js       # Duplicate URL detection
│   │   ├── validate-paths.js         # Path convention validation
│   │   ├── check-sources.js          # Source registration validation
│   │   └── generate-stats.js         # Statistics generation
│   │
│   ├── ISSUE_TEMPLATE/
│   │   ├── new-source.md             # Template for adding new source
│   │   ├── stale-report.md           # Template for stale doc reports
│   │   └── bug-report.md             # General bug report
│   │
│   └── CODEOWNERS                    # Code ownership rules
│
├── .doclib/                          # Library configuration
│   ├── config.yaml                   # Global configuration
│   ├── sources.yaml                  # Source registry
│   └── schemas/
│       ├── frontmatter.schema.json   # JSON Schema for frontmatter
│       └── source.schema.json        # JSON Schema for .source.yaml
│
├── sources/                          # All documentation lives here
│   ├── apple/
│   │   ├── .source.yaml              # Apple source configuration
│   │   ├── swiftui/
│   │   │   ├── views/
│   │   │   │   ├── text.md
│   │   │   │   └── image.md
│   │   │   └── data-flow/
│   │   │       └── state.md
│   │   ├── uikit/
│   │   │   └── views/
│   │   │       └── uibutton.md
│   │   └── foundation/
│   │       └── ...
│   │
│   ├── react/
│   │   ├── .source.yaml
│   │   ├── hooks/
│   │   │   ├── use-state.md
│   │   │   └── use-effect.md
│   │   └── components/
│   │       └── ...
│   │
│   ├── cloudflare/
│   │   ├── .source.yaml
│   │   └── workers/
│   │       ├── runtime-apis/
│   │       │   └── kv.md
│   │       └── configuration/
│   │           └── ...
│   │
│   ├── typescript/
│   │   ├── .source.yaml
│   │   └── handbook/
│   │       └── ...
│   │
│   └── mdn/
│       ├── .source.yaml
│       └── javascript/
│           └── ...
│
├── templates/                        # Templates for new content
│   ├── document.md                   # Template for new documents
│   └── source.yaml                   # Template for new sources
│
├── .gitignore
├── .editorconfig
├── README.md
├── CONTRIBUTING.md
├── TECH-SPECS.md                     # This document
└── LICENSE                           # MIT License
```

---

## 3. Configuration Files

### `.doclib/config.yaml` — Global Configuration

```yaml
# documentation-library global configuration
# Schema version for migrations
schemaVersion: 1

# =============================================================================
# Documentation Standards
# =============================================================================

frontmatter:
  # Fields that must be present in every document
  required:
    - title           # Document title
    - url             # Original source URL
    - capturedAt      # ISO 8601 timestamp of capture

  # Optional fields (validated if present)
  optional:
    - breadcrumb      # Array of navigation path segments
    - version         # Version string (e.g., "iOS 18", "19", "latest")
    - language        # Programming language (e.g., "swift", "typescript")
    - source          # Source identifier (auto-derived from path if missing)
    - lastModified    # Last modified date from source (if available)
    - tags            # Array of tags for additional categorization

  # Field validation rules
  validation:
    title:
      type: string
      minLength: 1
      maxLength: 200
    
    url:
      type: string
      format: uri
    
    capturedAt:
      type: string
      format: date-time
    
    breadcrumb:
      type: array
      items:
        type: string
      maxItems: 10
    
    version:
      type: string
      maxLength: 50
    
    language:
      type: string
      enum:
        - swift
        - objective-c
        - javascript
        - typescript
        - python
        - rust
        - go
        - java
        - kotlin
        - c
        - cpp
        - csharp
        - ruby
        - php
        - html
        - css
        - sql
        - shell
        - yaml
        - json
        - markdown
        - other

# =============================================================================
# Path Conventions
# =============================================================================

paths:
  # Root directory for all documentation
  sourcesRoot: sources
  
  # Maximum directory depth under a source
  # sources/apple/swiftui/views/text.md = depth 3 (swiftui/views/text.md)
  maxDepth: 6
  
  # File extension for documents
  extension: .md
  
  # Slug pattern for directory and file names
  # Allows: lowercase letters, numbers, hyphens
  slugPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
  
  # Reserved names that cannot be used
  reserved:
    - .source.yaml
    - .git
    - node_modules
    - README.md

# =============================================================================
# Quality Thresholds
# =============================================================================

quality:
  # Minimum content length (characters, excluding frontmatter)
  minContentLength: 100
  
  # Maximum file size (bytes)
  maxFileSize: 1048576  # 1MB
  
  # Stale threshold (days since capture)
  staleThresholdDays: 180
  
  # Duplicate detection
  duplicates:
    # How to handle same URL
    # "reject" - fail validation
    # "warn" - warning only
    # "allow-different-versions" - allow if versions differ
    sameUrl: allow-different-versions

# =============================================================================
# Integrations
# =============================================================================

integrations:
  # Webhook to notify RAG pipeline
  pipeline:
    enabled: true
    # URL stored in GitHub secret: PIPELINE_WEBHOOK_URL
    # API key stored in GitHub secret: PIPELINE_API_KEY
    events:
      - docs_added
      - docs_updated
      - docs_deleted
    
  # Trigger full reindex on schedule
  scheduledReindex:
    enabled: false
    cron: "0 0 * * 0"  # Weekly on Sunday

# =============================================================================
# GitHub Actions Configuration
# =============================================================================

actions:
  # Run validation on these events
  validate:
    onPush: true
    onPullRequest: true
    paths:
      - "sources/**"
  
  # Auto-fix issues in PRs
  autoFix:
    enabled: true
    fixes:
      - normalize-urls
      - format-dates
      - add-source-field
      - fix-breadcrumb-format
  
  # Statistics updates
  stats:
    enabled: true
    updateOnMerge: true
    weeklyReport: true
  
  # Stale documentation checks
  staleCheck:
    enabled: true
    schedule: monthly
    createIssue: true
```

### `.doclib/sources.yaml` — Source Registry

```yaml
# Registered documentation sources
# Each entry corresponds to a folder under sources/

# =============================================================================
# Source Definitions
# =============================================================================

sources:
  # ---------------------------------------------------------------------------
  # Apple Developer Documentation
  # ---------------------------------------------------------------------------
  apple:
    displayName: "Apple Developer Documentation"
    description: "Official documentation for Apple platforms and frameworks"
    baseUrl: "https://developer.apple.com"
    
    # Domains that map to this source
    domains:
      - developer.apple.com
    
    # Version management strategy
    versioning:
      # Strategy types:
      # - "platform": Versions like "iOS 18", "macOS 15"
      # - "semver": Semantic versions like "18.0", "19.0"
      # - "none": No versioning, always "latest"
      strategy: platform
      default: latest
      
      # Tracked versions (for documentation purposes)
      tracked:
        - iOS 18
        - iOS 17
        - macOS 15
        - macOS 14
        - watchOS 11
        - tvOS 18
    
    # Primary languages in this documentation
    languages:
      - swift
      - objective-c
    
    # URL patterns for path derivation
    pathPatterns:
      # Pattern: regex → path prefix
      "/documentation/swiftui": swiftui
      "/documentation/uikit": uikit
      "/documentation/foundation": foundation
      "/documentation/combine": combine
      "/documentation/appkit": appkit
    
    # Source status
    status: active  # active | deprecated | archived
    
  # ---------------------------------------------------------------------------
  # React Documentation
  # ---------------------------------------------------------------------------
  react:
    displayName: "React Documentation"
    description: "Official React documentation"
    baseUrl: "https://react.dev"
    
    domains:
      - react.dev
      - reactjs.org  # Legacy domain
    
    versioning:
      strategy: semver
      default: latest
      tracked:
        - "19"
        - "18"
    
    languages:
      - javascript
      - typescript
    
    pathPatterns:
      "/reference/react": reference
      "/learn": learn
      "/blog": blog
    
    status: active
    
  # ---------------------------------------------------------------------------
  # Cloudflare Documentation
  # ---------------------------------------------------------------------------
  cloudflare:
    displayName: "Cloudflare Documentation"
    description: "Cloudflare developer documentation"
    baseUrl: "https://developers.cloudflare.com"
    
    domains:
      - developers.cloudflare.com
    
    versioning:
      strategy: none
      default: latest
    
    languages:
      - javascript
      - typescript
      - rust
      - python
    
    pathPatterns:
      "/workers": workers
      "/pages": pages
      "/r2": r2
      "/d1": d1
      "/vectorize": vectorize
      "/ai": ai
    
    status: active
    
  # ---------------------------------------------------------------------------
  # TypeScript Documentation
  # ---------------------------------------------------------------------------
  typescript:
    displayName: "TypeScript Documentation"
    description: "Official TypeScript documentation and handbook"
    baseUrl: "https://www.typescriptlang.org"
    
    domains:
      - www.typescriptlang.org
      - typescriptlang.org
    
    versioning:
      strategy: semver
      default: latest
      tracked:
        - "5.x"
        - "4.x"
    
    languages:
      - typescript
    
    pathPatterns:
      "/docs/handbook": handbook
      "/docs/reference": reference
    
    status: active
    
  # ---------------------------------------------------------------------------
  # MDN Web Docs
  # ---------------------------------------------------------------------------
  mdn:
    displayName: "MDN Web Docs"
    description: "Mozilla Developer Network web documentation"
    baseUrl: "https://developer.mozilla.org"
    
    domains:
      - developer.mozilla.org
    
    versioning:
      strategy: none
      default: latest
    
    languages:
      - javascript
      - html
      - css
    
    pathPatterns:
      "/en-US/docs/Web/JavaScript": javascript
      "/en-US/docs/Web/CSS": css
      "/en-US/docs/Web/HTML": html
      "/en-US/docs/Web/API": web-api
    
    status: active

# =============================================================================
# Domain Mapping (Quick Reference)
# =============================================================================
# This is auto-generated from source definitions above
# Used by browser extension for path generation

domainMapping:
  developer.apple.com: apple
  react.dev: react
  reactjs.org: react
  developers.cloudflare.com: cloudflare
  www.typescriptlang.org: typescript
  typescriptlang.org: typescript
  developer.mozilla.org: mdn
```

### `sources/{source}/.source.yaml` — Per-Source Configuration

```yaml
# sources/apple/.source.yaml
# Per-source configuration and metadata

# Basic information (can override sources.yaml)
name: apple
displayName: "Apple Developer Documentation"
baseUrl: "https://developer.apple.com"

# Extraction hints for the browser extension
extraction:
  # Primary programming language
  primaryLanguage: swift
  
  # CSS selectors for content extraction
  selectors:
    content:
      - ".documentation-content"
      - ".doc-content"
      - "main article"
    title:
      - ".topic-title h1"
      - "h1"
    breadcrumb:
      - ".navigator-breadcrumbs a"
      - ".hierarchy-list a"
    version:
      - ".availability"
      - ".platforms"
    codeBlocks:
      - "pre code"
      - ".code-listing code"

# Custom path mappings for this source
pathMappings:
  # URL path segment → local directory
  swiftui: swiftui
  uikit: uikit
  foundation: foundation
  combine: combine

# Statistics (auto-updated by GitHub Actions)
stats:
  documentCount: 0
  lastUpdated: null
  lastCapturedAt: null
  topContributors: []

# Source-specific notes
notes: |
  Apple Developer Documentation uses JavaScript rendering.
  Content must be captured via browser extension, not scraped.
  
  Version information is stored in frontmatter, not directory structure,
  because Apple URLs do not include version identifiers.
```

---

## 4. Document Format

### Frontmatter Specification

Every Markdown document must begin with YAML frontmatter:

```yaml
---
# Required fields
title: Text                                          # Document title
url: https://developer.apple.com/documentation/swiftui/text  # Source URL
capturedAt: 2024-12-05T10:30:00.000Z                # When captured (ISO 8601)

# Recommended fields
breadcrumb:                                          # Navigation hierarchy
  - SwiftUI
  - Views
  - Text
version: iOS 18                                      # Version/platform
source: apple                                        # Source identifier

# Optional fields
language: swift                                      # Primary code language
lastModified: 2024-11-15T00:00:00.000Z              # Source last modified
tags:                                                # Additional categorization
  - ui-components
  - text-display
---

# Document content starts here...
```

### Field Definitions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `title` | Yes | string | Human-readable document title |
| `url` | Yes | string (URI) | Original source URL |
| `capturedAt` | Yes | string (ISO 8601) | Timestamp when content was captured |
| `breadcrumb` | No | string[] | Navigation path from root to document |
| `version` | No | string | Version identifier (e.g., "iOS 18", "19", "latest") |
| `source` | No | string | Source identifier, auto-derived from path if missing |
| `language` | No | string (enum) | Primary programming language in code examples |
| `lastModified` | No | string (ISO 8601) | Last modified date from source |
| `tags` | No | string[] | Additional categorization tags |

### Frontmatter JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://github.com/USER/documentation-library/schemas/frontmatter",
  "title": "Document Frontmatter",
  "type": "object",
  "required": ["title", "url", "capturedAt"],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Document title"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Original source URL"
    },
    "capturedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of when content was captured"
    },
    "breadcrumb": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 10,
      "description": "Navigation hierarchy path"
    },
    "version": {
      "type": "string",
      "maxLength": 50,
      "description": "Version or platform identifier"
    },
    "source": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Source identifier"
    },
    "language": {
      "type": "string",
      "enum": [
        "swift", "objective-c", "javascript", "typescript",
        "python", "rust", "go", "java", "kotlin", "c", "cpp",
        "csharp", "ruby", "php", "html", "css", "sql", "shell",
        "yaml", "json", "markdown", "other"
      ],
      "description": "Primary programming language"
    },
    "lastModified": {
      "type": "string",
      "format": "date-time",
      "description": "Source document last modified date"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string", "pattern": "^[a-z0-9-]+$" },
      "maxItems": 10,
      "description": "Categorization tags"
    }
  },
  "additionalProperties": false
}
```

### Example Document

```markdown
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
capturedAt: 2024-12-05T10:30:00.000Z
---

# Text

A view that displays one or more lines of read-only text.

## Overview

A `Text` view displays a string of characters with optional styling. You can use text views to display static text, or bind them to a data source to display dynamic content.

## Creating a Text View

Create a text view by passing a string to the `Text` initializer:

```swift
Text("Hello, World!")
```

You can also create text from a localized string key:

```swift
Text("greeting")
```

## Styling Text

Apply modifiers to customize the appearance:

```swift
Text("Hello, World!")
    .font(.title)
    .foregroundColor(.blue)
    .bold()
```

## Topics

### Creating a Text View

- `init(_ content: String)`
- `init(_ key: LocalizedStringKey)`

### Styling

- `font(_:)`
- `foregroundColor(_:)`
- `bold()`
- `italic()`
```

---

## 5. Path Conventions

### Path Structure

```
sources/{source}/{category}/[{subcategory}/...]{slug}.md
```

**Components:**

| Component | Description | Example |
|-----------|-------------|---------|
| `sources/` | Root directory (fixed) | `sources/` |
| `{source}` | Source identifier | `apple`, `react` |
| `{category}` | Primary category | `swiftui`, `hooks` |
| `{subcategory}` | Optional sub-categories | `views`, `data-flow` |
| `{slug}.md` | Document filename | `text.md`, `use-state.md` |

### Slug Rules

- Lowercase letters and numbers only
- Words separated by hyphens
- No special characters
- No consecutive hyphens
- Must not start or end with hyphen

**Valid:** `text.md`, `use-state.md`, `uibutton.md`, `kv-namespace.md`
**Invalid:** `Text.md`, `use_state.md`, `UIButton.md`, `kv--namespace.md`

### Path Derivation

The browser extension derives paths from breadcrumbs:

```typescript
// Breadcrumb: ["SwiftUI", "Views", "Text"]
// URL: https://developer.apple.com/documentation/swiftui/text
// Domain mapping: developer.apple.com → apple

// Result: sources/apple/swiftui/views/text.md

function derivePath(breadcrumb: string[], source: string): string {
  const parts = breadcrumb.map(slugify);
  const filename = parts.pop() || 'index';
  const directory = parts.join('/');
  
  return `sources/${source}/${directory}/${filename}.md`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

### Maximum Depth

Paths should not exceed 6 levels below the source:

```
sources/apple/swiftui/views/modifiers/layout/frame.md  ✓ (6 levels)
sources/apple/a/b/c/d/e/f/g.md                         ✗ (7 levels)
```

---

## 6. Versioning Strategies

### Strategy 1: Platform Versioning

**Used by:** Apple (iOS, macOS, etc.)

Version stored in frontmatter, not directory structure:

```yaml
---
title: Text
version: iOS 18
---
```

**Rationale:**
- Apple URLs don't include version
- Same content may apply to multiple platforms
- Most queries want "latest" — version is for filtering

**File structure:**
```
sources/apple/swiftui/views/text.md        # Has version: iOS 18 in frontmatter
```

### Strategy 2: Semantic Versioning

**Used by:** React, TypeScript

Version stored in frontmatter:

```yaml
---
title: useState
version: "19"
---
```

**When to use folders instead:**

If major versions have completely different APIs, use version folders:

```
sources/react/
├── v19/
│   └── hooks/
│       └── use-state.md
└── v18/
    └── hooks/
        └── use-state.md
```

**Decision criteria:**
- Same URL for both versions → frontmatter versioning
- Different URLs per version → consider folder versioning
- 80%+ content overlap → frontmatter versioning
- Significant API differences → folder versioning

### Strategy 3: No Versioning

**Used by:** Cloudflare, MDN

Always represents current state:

```yaml
---
title: KV
version: latest
---
```

### Version Field Values

| Strategy | Example Values | Notes |
|----------|---------------|-------|
| Platform | `iOS 18`, `macOS 15`, `watchOS 11` | Include platform name |
| Semver | `19`, `18.2`, `5.x` | Major version usually sufficient |
| None | `latest` | Explicit "latest" preferred over omitting |

---

## 7. GitHub Actions

### Workflow: `validate.yml`

**Purpose:** Validate documentation on push and PR

```yaml
# .github/workflows/validate.yml

name: Validate Documentation

on:
  push:
    branches: [main]
    paths: ['sources/**']
  pull_request:
    branches: [main]
    paths: ['sources/**']

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '.github/scripts/package-lock.json'
          
      - name: Install dependencies
        run: npm ci
        working-directory: .github/scripts
        
      - name: Validate frontmatter
        run: node validate-frontmatter.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
        
      - name: Check for duplicates
        run: node check-duplicates.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
        
      - name: Validate paths
        run: node validate-paths.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
        
      - name: Check source registration
        run: node check-sources.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
          
      - name: Generate validation report
        if: always()
        run: node generate-report.js
        working-directory: .github/scripts
        
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: .github/scripts/report.md
```

### Workflow: `notify-pipeline.yml`

**Purpose:** Notify RAG pipeline when documentation changes

```yaml
# .github/workflows/notify-pipeline.yml

name: Notify Pipeline

on:
  push:
    branches: [main]
    paths: ['sources/**']

jobs:
  notify:
    name: Notify RAG Pipeline
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
          
      - name: Get changed files
        id: changes
        run: |
          # Get list of changed markdown files
          CHANGED=$(git diff --name-only HEAD~1 HEAD -- 'sources/**/*.md' || echo "")
          
          # Count changes
          ADDED=$(git diff --name-only --diff-filter=A HEAD~1 HEAD -- 'sources/**/*.md' | wc -l)
          MODIFIED=$(git diff --name-only --diff-filter=M HEAD~1 HEAD -- 'sources/**/*.md' | wc -l)
          DELETED=$(git diff --name-only --diff-filter=D HEAD~1 HEAD -- 'sources/**/*.md' | wc -l)
          
          echo "changed<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          
          echo "added=$ADDED" >> $GITHUB_OUTPUT
          echo "modified=$MODIFIED" >> $GITHUB_OUTPUT
          echo "deleted=$DELETED" >> $GITHUB_OUTPUT
          echo "total=$((ADDED + MODIFIED + DELETED))" >> $GITHUB_OUTPUT
          
      - name: Determine affected sources
        id: sources
        run: |
          SOURCES=$(echo "${{ steps.changes.outputs.changed }}" | \
            grep -oP 'sources/\K[^/]+' | \
            sort -u | \
            tr '\n' ',' | \
            sed 's/,$//')
          echo "affected=$SOURCES" >> $GITHUB_OUTPUT
          
      - name: Notify pipeline
        if: steps.changes.outputs.total != '0'
        run: |
          curl -X POST "${{ secrets.PIPELINE_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.PIPELINE_API_KEY }}" \
            -d '{
              "event": "docs_updated",
              "repository": "${{ github.repository }}",
              "ref": "${{ github.ref }}",
              "commit": "${{ github.sha }}",
              "sources": "${{ steps.sources.outputs.affected }}",
              "stats": {
                "added": ${{ steps.changes.outputs.added }},
                "modified": ${{ steps.changes.outputs.modified }},
                "deleted": ${{ steps.changes.outputs.deleted }},
                "total": ${{ steps.changes.outputs.total }}
              },
              "triggeredBy": "${{ github.actor }}",
              "timestamp": "${{ github.event.head_commit.timestamp }}"
            }'
            
      - name: Summary
        run: |
          echo "### 📚 Documentation Update" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Count |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Added | ${{ steps.changes.outputs.added }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Modified | ${{ steps.changes.outputs.modified }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Deleted | ${{ steps.changes.outputs.deleted }} |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Sources affected:** ${{ steps.sources.outputs.affected }}" >> $GITHUB_STEP_SUMMARY
```

### Workflow: `update-stats.yml`

**Purpose:** Update source statistics on merge and weekly

```yaml
# .github/workflows/update-stats.yml

name: Update Statistics

on:
  push:
    branches: [main]
    paths: ['sources/**']
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday at midnight
  workflow_dispatch:

jobs:
  update-stats:
    name: Update Statistics
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: .github/scripts
        
      - name: Generate statistics
        run: node generate-stats.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
        
      - name: Update README
        run: node update-readme-stats.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
        
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          
          git add sources/*/.source.yaml README.md
          
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: update documentation statistics"
            git push
          fi
```

### Workflow: `stale-check.yml`

**Purpose:** Monthly check for outdated documentation

```yaml
# .github/workflows/stale-check.yml

name: Stale Documentation Check

on:
  schedule:
    - cron: '0 0 1 * *'  # First day of each month
  workflow_dispatch:

jobs:
  check-stale:
    name: Check for Stale Documents
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: .github/scripts
        
      - name: Find stale documents
        id: stale
        run: node find-stale.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
          STALE_DAYS: 180
        
      - name: Create issue
        if: steps.stale.outputs.count > 0
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('.github/scripts/stale-report.md', 'utf-8');
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `📚 Stale Documentation Report - ${new Date().toISOString().slice(0, 7)}`,
              body: report,
              labels: ['documentation', 'maintenance', 'stale']
            });
```

### Workflow: `auto-organize.yml`

**Purpose:** Auto-fix common issues in PRs

```yaml
# .github/workflows/auto-organize.yml

name: Auto-Organize

on:
  pull_request:
    branches: [main]
    paths: ['sources/**']

permissions:
  contents: write
  pull-requests: write

jobs:
  organize:
    name: Auto-Fix Issues
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout PR
        uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: .github/scripts
        
      - name: Run auto-fixes
        id: fixes
        run: node auto-fix.js
        working-directory: .github/scripts
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}
        
      - name: Commit fixes
        if: steps.fixes.outputs.fixed > 0
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          
          git add sources/
          git commit -m "chore: auto-fix documentation formatting

          Fixed ${{ steps.fixes.outputs.fixed }} issues:
          ${{ steps.fixes.outputs.summary }}"
          
          git push
          
      - name: Comment on PR
        if: steps.fixes.outputs.fixed > 0
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `🤖 Auto-fixed ${{ steps.fixes.outputs.fixed }} formatting issues:\n\n${{ steps.fixes.outputs.summary }}`
            });
```

---

## 8. Validation Scripts

### `validate-frontmatter.js`

```javascript
// .github/scripts/validate-frontmatter.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const WORKSPACE = process.env.GITHUB_WORKSPACE || process.cwd();
const SOURCES_DIR = path.join(WORKSPACE, 'sources');
const SCHEMA_PATH = path.join(WORKSPACE, '.doclib/schemas/frontmatter.schema.json');

// Load schema
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const errors = [];
const warnings = [];

// Find all markdown files
const files = glob.sync('**/*.md', { cwd: SOURCES_DIR });

console.log(`Validating ${files.length} documents...\n`);

for (const file of files) {
  const filePath = path.join(SOURCES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const { data: frontmatter, content: body } = matter(content);
    
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
    if (body.trim().length < 100) {
      warnings.push({
        file,
        message: 'Content is very short (less than 100 characters)',
      });
    }
    
    // Check URL is accessible (optional, slow)
    // Could add URL validation here
    
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
  console.warn('⚠️ Warnings:\n');
  for (const warning of warnings) {
    console.warn(`  ${warning.file}`);
    console.warn(`    ${warning.message}\n`);
  }
}

if (errors.length === 0) {
  console.log(`✅ All ${files.length} documents passed validation`);
  process.exit(0);
} else {
  console.error(`\n❌ ${errors.length} errors found`);
  process.exit(1);
}
```

### `check-duplicates.js`

```javascript
// .github/scripts/check-duplicates.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

const WORKSPACE = process.env.GITHUB_WORKSPACE || process.cwd();
const SOURCES_DIR = path.join(WORKSPACE, 'sources');

const urlIndex = new Map();  // url -> [{ file, version }]
const files = glob.sync('**/*.md', { cwd: SOURCES_DIR });

console.log(`Checking ${files.length} documents for duplicates...\n`);

for (const file of files) {
  const filePath = path.join(SOURCES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const { data: frontmatter } = matter(content);
    
    if (frontmatter.url) {
      // Normalize URL
      const url = new URL(frontmatter.url);
      url.search = '';
      url.hash = '';
      const normalizedUrl = url.href.replace(/\/$/, '');
      
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
  for (const [version, files] of byVersion) {
    if (files.length > 1) {
      duplicates.push({ url, version, files });
    }
  }
}

if (duplicates.length > 0) {
  console.error('❌ Duplicate documents found:\n');
  
  for (const dup of duplicates) {
    console.error(`  URL: ${dup.url}`);
    console.error(`  Version: ${dup.version}`);
    console.error(`  Files:`);
    for (const file of dup.files) {
      console.error(`    - ${file}`);
    }
    console.error('');
  }
  
  process.exit(1);
} else {
  console.log('✅ No duplicates found');
  process.exit(0);
}
```

### `auto-fix.js`

```javascript
// .github/scripts/auto-fix.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

const WORKSPACE = process.env.GITHUB_WORKSPACE || process.cwd();
const SOURCES_DIR = path.join(WORKSPACE, 'sources');

const fixes = [];
const files = glob.sync('**/*.md', { cwd: SOURCES_DIR });

console.log(`Scanning ${files.length} documents for fixable issues...\n`);

for (const file of files) {
  const filePath = path.join(SOURCES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const { data: frontmatter, content: body } = matter(content);
    let modified = false;
    const fileFixe = [];
    
    // Fix 1: Normalize capturedAt to ISO string
    if (frontmatter.capturedAt instanceof Date) {
      frontmatter.capturedAt = frontmatter.capturedAt.toISOString();
      fileFixe.push('Converted capturedAt to ISO string');
      modified = true;
    }
    
    // Fix 2: Remove trailing slash from URL
    if (frontmatter.url && frontmatter.url.endsWith('/')) {
      frontmatter.url = frontmatter.url.slice(0, -1);
      fileFixe.push('Removed trailing slash from URL');
      modified = true;
    }
    
    // Fix 3: Convert breadcrumb string to array
    if (frontmatter.breadcrumb && typeof frontmatter.breadcrumb === 'string') {
      frontmatter.breadcrumb = frontmatter.breadcrumb
        .split(/[>→]/)
        .map(s => s.trim())
        .filter(Boolean);
      fileFixe.push('Converted breadcrumb to array');
      modified = true;
    }
    
    // Fix 4: Add source field if missing
    if (!frontmatter.source) {
      const source = file.split('/')[0];
      frontmatter.source = source;
      fileFixe.push(`Added source: ${source}`);
      modified = true;
    }
    
    // Fix 5: Normalize version "latest" 
    if (frontmatter.version === '' || frontmatter.version === null) {
      frontmatter.version = 'latest';
      fileFixe.push('Set version to "latest"');
      modified = true;
    }
    
    // Fix 6: Remove empty optional fields
    const optionalFields = ['lastModified', 'tags', 'language'];
    for (const field of optionalFields) {
      if (frontmatter[field] === '' || frontmatter[field] === null) {
        delete frontmatter[field];
        fileFixe.push(`Removed empty ${field}`);
        modified = true;
      }
    }
    
    if (modified) {
      const newContent = matter.stringify(body, frontmatter);
      fs.writeFileSync(filePath, newContent);
      fixes.push({ file, fixes: fileFixe });
      console.log(`  Fixed: ${file}`);
      fileFixe.forEach(f => console.log(`    - ${f}`));
    }
    
  } catch (e) {
    console.warn(`  Warning: Could not process ${file}: ${e.message}`);
  }
}

// Output for GitHub Actions
const totalFixes = fixes.reduce((sum, f) => sum + f.fixes.length, 0);
const summary = fixes.map(f => `- ${f.file}: ${f.fixes.join(', ')}`).join('\n');

console.log(`\nTotal: ${totalFixes} fixes in ${fixes.length} files`);

// Set outputs for GitHub Actions
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `fixed=${totalFixes}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary<<EOF\n${summary}\nEOF\n`);
}
```

---

## 9. Integration Points

### Browser Extension → Repository

The browser extension commits files directly via GitHub API:

```typescript
// Extension commits to: sources/{source}/{path}/{slug}.md

// Domain mapping (must match sources.yaml)
const DOMAIN_MAPPING = {
  'developer.apple.com': 'apple',
  'react.dev': 'react',
  // ...
};

// Path generation (must match repository conventions)
function generatePath(url: string, breadcrumb: string[]): string {
  const hostname = new URL(url).hostname;
  const source = DOMAIN_MAPPING[hostname];
  const pathParts = breadcrumb.map(slugify);
  const filename = pathParts.pop() || 'index';
  
  return `sources/${source}/${pathParts.join('/')}/${filename}.md`;
}
```

**Sync mechanism:**

Option A: Extension fetches `sources.yaml` on startup
Option B: Extension includes mappings, checks for updates

### Repository → RAG Pipeline

When documentation changes are merged to main, a GitHub Action triggers the pipeline's ingest endpoint:

**API Call:**

```http
POST {PIPELINE_API_URL}/ingest
Authorization: Bearer {PIPELINE_API_KEY}
Content-Type: application/json

{
  "sourceId": "apple",
  "mode": "incremental"
}
```

**Response:**

```json
{
  "success": true,
  "workflowId": "abc-123",
  "message": "Ingest workflow started"
}
```

The pipeline then:
1. Fetches the source configuration
2. Discovers changed documents via GitHub API
3. Processes only new/modified documents (incremental mode)
4. Updates embeddings in Vectorize

**GitHub Secrets Required:**

| Secret | Description | Example |
|--------|-------------|---------|
| `PIPELINE_API_URL` | Base URL of documentation-domain-api | `https://docs-api.example.workers.dev` |
| `PIPELINE_API_KEY` | API key set via `wrangler secret put API_KEY` | `your-secret-key` |

---

## 10. Templates

### `templates/document.md`

```markdown
---
title: [Document Title]
url: [Source URL]
breadcrumb:
  - [Category]
  - [Subcategory]
  - [Title]
version: latest
language: [swift|javascript|typescript|...]
source: [source-name]
capturedAt: [ISO 8601 timestamp]
---

# [Document Title]

[Document content in Markdown format]

## Overview

[Brief overview of the topic]

## [Section 1]

[Content]

## [Section 2]

[Content]

## See Also

- [Related Link 1]
- [Related Link 2]
```

### `templates/source.yaml`

```yaml
# Template for new source configuration
# Copy to sources/{source-name}/.source.yaml

name: [source-name]
displayName: "[Human-Readable Name]"
baseUrl: "https://[domain]"

extraction:
  primaryLanguage: [language]
  selectors:
    content:
      - "[content-selector]"
    title:
      - "[title-selector]"
    breadcrumb:
      - "[breadcrumb-selector]"

pathMappings:
  [url-segment]: [local-directory]

stats:
  documentCount: 0
  lastUpdated: null
```

---

## 11. Implementation Checklist

### Phase 1: Repository Setup
- [ ] Create repository with MIT license
- [ ] Create base directory structure
- [ ] Add `.gitignore` and `.editorconfig`
- [ ] Create README.md with overview

### Phase 2: Configuration
- [ ] Create `.doclib/config.yaml`
- [ ] Create `.doclib/sources.yaml` with initial sources
- [ ] Create `.doclib/schemas/frontmatter.schema.json`
- [ ] Create `sources/` directory with initial source folders
- [ ] Add `.source.yaml` to each source folder

### Phase 3: Validation Scripts
- [ ] Set up `.github/scripts/` with package.json
- [ ] Implement `validate-frontmatter.js`
- [ ] Implement `check-duplicates.js`
- [ ] Implement `validate-paths.js`
- [ ] Implement `check-sources.js`
- [ ] Implement `auto-fix.js`
- [ ] Implement `generate-stats.js`
- [ ] Implement `find-stale.js`

### Phase 4: GitHub Actions
- [ ] Create `validate.yml` workflow
- [ ] Create `notify-pipeline.yml` workflow
- [ ] Create `update-stats.yml` workflow
- [ ] Create `stale-check.yml` workflow
- [ ] Create `auto-organize.yml` workflow
- [ ] Test all workflows

### Phase 5: Documentation
- [ ] Complete README.md with usage instructions
- [ ] Create CONTRIBUTING.md
- [ ] Create issue templates
- [ ] Add templates for new documents and sources

### Phase 6: Integration Testing
- [ ] Test browser extension commits
- [ ] Test pipeline fetching
- [ ] Test webhook notifications
- [ ] Verify validation catches errors
- [ ] Verify auto-fix works correctly

---

*This document serves as the authoritative reference for the `documentation-library` repository structure, conventions, and automation. All documentation captured by the browser extension and indexed by the RAG pipeline must conform to these specifications.*