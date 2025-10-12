# PR Validation Setup Guide

This repository now includes automatic validation for Pull Requests to ensure proper versioning and changelog maintenance.

## What Gets Validated

### 1. Version Bump Validation
- ✅ Version in `ha-screenshotter/package.json` must be bumped
- ✅ Version in `ha-screenshotter/config.yaml` must be bumped
- ✅ Both files must have the same version number
- ✅ New version must follow semantic versioning (higher than base)

### 2. Changelog Validation
- ✅ `CHANGELOG.md` must be updated with the new version
- ✅ Changelog entry must have proper format: `## [X.Y.Z] - YYYY-MM-DD`
- ✅ Changelog entry must contain categorized changes (Added/Changed/Fixed/etc.)
- ⚠️ Warns if date is not today (but doesn't fail)

### 3. Smart File Detection
- 🔍 Only requires version bumps when code/configuration files are changed
- ℹ️ Documentation-only changes (*.md, *.yml, LICENSE, etc.) don't require version bumps
- ✅ Provides clear feedback on which files were modified

## GitHub Branch Protection

To enforce these validations, set up branch protection rules for the `main` branch:

### Via GitHub Web UI:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Add these required checks:
   - `validate-version-and-changelog`
   - `validate-files-changed`
   - `test-screenshot-configurations` (existing)
   - `test-webserver` (existing)

### Via GitHub CLI:
```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Enable branch protection with required status checks
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate-version-and-changelog","validate-files-changed","test-screenshot-configurations","test-webserver"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

### Via Repository Settings (Manual):
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "validate-version-and-changelog",
      "validate-files-changed", 
      "test-screenshot-configurations",
      "test-webserver"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null
}
```

## Example Workflow

### 1. Making Changes
```bash
# Create feature branch
git checkout -b feature/new-functionality

# Make your code changes
# ... edit files ...

# Update version in package.json (e.g., 1.11.0 → 1.12.0)
jq '.version = "1.12.0"' ha-screenshotter/package.json > tmp.json && mv tmp.json ha-screenshotter/package.json

# Update version in config.yaml
sed -i 's/^version: "1.11.0"/version: "1.12.0"/' ha-screenshotter/config.yaml
```

### 2. Update Changelog
Add entry to top of `CHANGELOG.md`:
```markdown
## [1.12.0] - 2025-10-12

### Added
- New cropping functionality with enhanced validation
- Support for custom crop dimensions per URL

### Fixed  
- Resolved issue with image processing pipeline
```

### 3. Create Pull Request
The validation will automatically run and provide feedback:

✅ **Success Example:**
- Version bumped: 1.11.0 → 1.12.0
- Changelog updated with proper format
- All validations pass → PR can be merged

❌ **Failure Example:**
- Version not bumped or inconsistent between files  
- Missing changelog entry
- PR blocked until issues resolved

## Bypassing Validation (Admin Only)

If you need to bypass validation for special cases:

1. **Documentation-only PRs**: These automatically skip version validation
2. **Emergency hotfixes**: Admins can override branch protection
3. **Release preparation**: Separate validation job for release branches

## Validation Features

- 📝 **Detailed feedback** in PR comments and job summaries
- 🔍 **Smart detection** of change types (code vs docs)
- 📅 **Date validation** for changelog entries
- 🔢 **Semantic versioning** enforcement
- 📋 **File change analysis** with clear explanations

This ensures consistent versioning and changelog maintenance across all releases while providing clear guidance when validations fail.