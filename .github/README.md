# CI Tests Restructuring

This directory contains the restructured CI test workflows for ha-screenshotter.

## 📁 Structure

```
.github/
├── workflows/
│   ├── ci-tests.yml              # Original workflow (910 lines) - DEPRECATED
│   ├── ci-tests-new.yml          # New simplified orchestrator (24 lines)
│   ├── test-screenshots.yml      # Screenshot configuration tests
│   └── test-webserver.yml        # Webserver tests (with matrix strategy)
├── actions/
│   ├── setup-test-env/           # Reusable action: Setup Docker & tools
│   │   └── action.yml
│   └── test-webserver-port/      # Reusable action: Test webserver on a port
│       └── action.yml
└── scripts/
    ├── validate-screenshots.sh    # Validate screenshot properties
    ├── create-combined-image.sh   # Create combined screenshot image
    ├── test-webserver-endpoint.sh # Test webserver endpoint
    └── generate-webserver-summary.sh # Generate test summary
```

## 🎯 Benefits

### Before (ci-tests.yml - 910 lines)
- ❌ Single monolithic file
- ❌ 3 separate jobs with 80%+ duplicate code
- ❌ 200+ line bash scripts embedded in YAML
- ❌ Hard to maintain and test

### After (ci-tests-new.yml - 24 lines)
- ✅ **96% reduction** in main workflow file size
- ✅ **DRY principle** - reusable components
- ✅ **Matrix strategy** - 3 webserver tests → 1 job
- ✅ **Testable scripts** - can run locally
- ✅ **Modular** - easy to add new tests

## 🚀 Usage

### Running the New CI
The new workflow is in `ci-tests-new.yml`. To use it:

1. **Test it first** (manual workflow dispatch)
2. **Verify all tests pass**
3. **Rename files**:
   ```bash
   mv .github/workflows/ci-tests.yml .github/workflows/ci-tests-old.yml
   mv .github/workflows/ci-tests-new.yml .github/workflows/ci-tests.yml
   ```

### Testing Locally

All shell scripts can be tested locally:

```bash
# Validate screenshots
.github/scripts/validate-screenshots.sh <test_dir> <subfolder> <validation_json>

# Test webserver
.github/scripts/test-webserver-endpoint.sh 3000 "downloaded"

# Create combined image
.github/scripts/create-combined-image.sh "ha-screenshotter"

# Generate summary
.github/scripts/generate-webserver-summary.sh 3000 summary.md test-dir subfolder prefix
```

## 📊 Comparison

| Metric | Old | New | Improvement |
|--------|-----|-----|-------------|
| Main workflow lines | 910 | 24 | **96% reduction** |
| Total files | 1 | 9 | Better organization |
| Webserver jobs | 3 | 1 (matrix) | **67% reduction** |
| Code duplication | High | None | **DRY principle** |
| Testability | Poor | Good | Scripts testable locally |
| Maintainability | Low | High | Modular components |

## 🔧 Adding New Tests

### Add a Screenshot Test
Edit `ha-screenshotter/tests.json` - no workflow changes needed!

### Add a Webserver Test Variant
Edit `.github/workflows/test-webserver.yml`:
```yaml
matrix:
  config:
    - name: "new-test"
      port: 8080
      expect_failure: false
```

### Add a Custom Test
1. Create a composite action in `.github/actions/`
2. Call it from a workflow file

## 🐛 Troubleshooting

### Script Permission Errors
Make scripts executable:
```bash
chmod +x .github/scripts/*.sh
```

### Matrix Job Fails
Check individual job logs in GitHub Actions. Each matrix job runs independently.

### Migration Issues
Keep `ci-tests-old.yml` as backup until new workflow is proven stable.

## 📝 Migration Checklist

- [x] Create shell scripts in `.github/scripts/`
- [x] Create composite actions in `.github/actions/`
- [x] Create modular workflow files
- [x] Create new main workflow orchestrator
- [ ] Test new workflow via workflow_dispatch
- [ ] Verify all tests pass
- [ ] Rename old workflow to `-old.yml`
- [ ] Rename new workflow to `ci-tests.yml`
- [ ] Monitor first PR run
- [ ] Delete old workflow after successful run

## 🎓 Key Concepts

### Composite Actions
Reusable action definitions that can be called from multiple workflows. They encapsulate common setup and test logic.

### Workflow Call
`workflow_call` allows workflows to be called from other workflows, enabling modular workflow design.

### Matrix Strategy
Run the same job with different configurations. Reduces code duplication and improves parallel execution.

### Shell Scripts
Extracting bash logic to separate files improves testability, readability, and enables local development.
