---
name: 🤖 Agent Task Request
about: Template for requesting automated agent assistance
title: '[AGENT] '
labels: ['agent-task', 'needs-review']
assignees: []
---

## 🤖 Agent Task Request

**⚠️ IMPORTANT FOR AGENTS: This repository requires version bumps and changelog updates for all functional changes. See [AGENT_INSTRUCTIONS.md](../AGENT_INSTRUCTIONS.md) for detailed requirements.**

### Task Description
<!-- Clearly describe what needs to be implemented -->

### Expected Changes
<!-- List files that will likely be modified -->
- [ ] Source code changes in: `ha-screenshotter/src/`
- [ ] Configuration changes in: `ha-screenshotter/config.yaml`
- [ ] Documentation updates
- [ ] Test updates

### Version Impact
<!-- Help the agent understand what type of version bump is needed -->
- [ ] **Patch (X.Y.Z+1)** - Bug fix, small improvement
- [ ] **Minor (X.Y+1.0)** - New feature, backward compatible
- [ ] **Major (X+1.0.0)** - Breaking change, major feature

### Agent Checklist
**The agent MUST complete these steps:**

- [ ] ✅ Check current version in `ha-screenshotter/package.json`
- [ ] ✅ Check current version in `ha-screenshotter/config.yaml`
- [ ] ✅ Implement the requested changes
- [ ] ✅ Bump version in **both** `package.json` AND `config.yaml` (must match)
- [ ] ✅ Add entry to `CHANGELOG.md` with format: `## [X.Y.Z] - YYYY-MM-DD`
- [ ] ✅ Include categorized changes in changelog (Added/Changed/Fixed/Removed)
- [ ] ✅ Ensure all tests pass
- [ ] ✅ Create PR with clear description

### Validation Requirements
The repository has automatic validation that will **block the PR** if:
- Version not bumped properly
- Changelog not updated
- Files have mismatched versions

### Additional Context
<!-- Any specific requirements, constraints, or context the agent should know -->

---

**📚 Required Reading for Agents:**
- [AGENT_INSTRUCTIONS.md](../AGENT_INSTRUCTIONS.md) - Complete agent workflow guide
- [PR_VALIDATION_SETUP.md](../PR_VALIDATION_SETUP.md) - Validation system details
- [CHANGELOG.md](../CHANGELOG.md) - Example changelog format