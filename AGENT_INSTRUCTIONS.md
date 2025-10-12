# CODING AGENT INSTRUCTIONS

## 🤖 For GitHub Copilot and Other Automated Agents

**IMPORTANT:** This repository has strict validation requirements for version management and changelog maintenance. All agents must follow these procedures.

## 📋 MANDATORY CHECKLIST for Every Code Change

### When Making ANY Functional Changes (not just documentation):

1. **📦 Version Bump (REQUIRED)**
   ```bash
   # Update package.json version
   # Current: Check ha-screenshotter/package.json for current version
   # New: Bump according to semantic versioning rules
   
   # Update config.yaml version  
   # Must match package.json exactly
   ```

2. **📝 Changelog Update (REQUIRED)**
   ```markdown
   # Add to top of CHANGELOG.md:
   ## [NEW_VERSION] - YYYY-MM-DD
   
   ### Added
   - Description of new features
   
   ### Changed  
   - Description of modifications
   
   ### Fixed
   - Description of bug fixes
   
   ### Removed
   - Description of removals
   ```

3. **🔍 Files to Always Update for Feature/Fix PRs:**
   - `ha-screenshotter/package.json` (version field)
   - `ha-screenshotter/config.yaml` (version field) 
   - `CHANGELOG.md` (new entry at top)

## 🚨 VALIDATION RULES

### Version Bumping Rules:
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (X.Y.0)**: New features, backward compatible  
- **Patch (X.Y.Z)**: Bug fixes, small improvements

### Changelog Format (STRICT):
```markdown
## [1.12.0] - 2025-10-12

### Added
- New cropping functionality with validation
- Support for custom dimensions per URL

### Changed
- Improved error handling in screenshot processing

### Fixed
- Resolved memory leak in image processing
- Fixed configuration validation edge cases
```

## 🛑 AUTOMATIC VALIDATION

The repository has GitHub Actions that will **BLOCK** your PR if:

- ❌ Version not bumped in package.json
- ❌ Version not bumped in config.yaml  
- ❌ Version mismatch between the two files
- ❌ Changelog entry missing for new version
- ❌ Changelog entry improperly formatted
- ❌ Semantic versioning rules violated

## 📖 Exception: Documentation-Only Changes

Version bumps are **NOT required** for:
- README updates
- Documentation (*.md files)
- CI configuration (*.yml, *.yaml)
- License files
- .gitignore changes

## 🎯 AGENT WORKFLOW TEMPLATE

```bash
# 1. Check current version
CURRENT_VERSION=$(jq -r '.version' ha-screenshotter/package.json)
echo "Current version: $CURRENT_VERSION"

# 2. Determine new version (example: patch bump)
NEW_VERSION="1.12.1"  # Update appropriately

# 3. Update package.json
jq '.version = "'$NEW_VERSION'"' ha-screenshotter/package.json > tmp.json && mv tmp.json ha-screenshotter/package.json

# 4. Update config.yaml  
sed -i 's/^version: "'$CURRENT_VERSION'"/version: "'$NEW_VERSION'"/' ha-screenshotter/config.yaml

# 5. Update changelog (add to top, after line 6)
TODAY=$(date +%Y-%m-%d)
sed -i '7i\\n## ['$NEW_VERSION'] - '$TODAY'\n\n### Added\n- Your new feature description\n\n### Fixed\n- Your bug fix description' CHANGELOG.md
```

## 🔧 DEBUGGING VALIDATION FAILURES

If your PR fails validation:

1. **Check validation results** in PR comments and Actions tab
2. **Common fixes:**
   ```bash
   # Fix version mismatch
   jq '.version = "X.Y.Z"' ha-screenshotter/package.json > tmp.json && mv tmp.json ha-screenshotter/package.json
   sed -i 's/^version: .*/version: "X.Y.Z"/' ha-screenshotter/config.yaml
   
   # Add missing changelog entry
   # Edit CHANGELOG.md manually or use sed commands above
   ```

## 💡 TIPS FOR AGENTS

- **Always check current version first** before making changes
- **Use semantic versioning** - patch for fixes, minor for features, major for breaking changes
- **Be descriptive in changelog** - explain what changed and why
- **Test locally** if possible before creating PR
- **Review validation output** carefully if checks fail

## 📞 HUMAN ESCALATION

If validation requirements seem inappropriate for your changes:
- Comment in the PR explaining why validation should be bypassed
- Tag repository maintainers for review
- Consider if your changes actually warrant a version bump

---

**Remember: These validations exist to maintain release quality and proper versioning. Following them ensures users get clear information about changes and proper version tracking.**