#!/bin/bash
# bump_version.sh - Helper script for agents to properly bump versions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🤖 HA Screenshotter Version Bump Helper${NC}"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "ha-screenshotter/package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the repository root${NC}"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(jq -r '.version' ha-screenshotter/package.json)
echo -e "📦 Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Parse version parts
IFS='.' read -r -a version_parts <<< "$CURRENT_VERSION"
MAJOR="${version_parts[0]}"
MINOR="${version_parts[1]}"  
PATCH="${version_parts[2]}"

echo ""
echo "Select version bump type:"
echo "1) Patch ($MAJOR.$MINOR.$((PATCH + 1))) - Bug fixes"
echo "2) Minor ($MAJOR.$((MINOR + 1)).0) - New features" 
echo "3) Major ($((MAJOR + 1)).0.0) - Breaking changes"
echo "4) Custom version"
echo ""

if [ -z "$1" ]; then
    read -p "Enter choice (1-4): " choice
else
    choice="$1"
fi

case $choice in
    1)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        CHANGE_TYPE="patch"
        ;;
    2)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        CHANGE_TYPE="minor"
        ;;
    3) 
        NEW_VERSION="$((MAJOR + 1)).0.0"
        CHANGE_TYPE="major"
        ;;
    4)
        read -p "Enter new version (e.g., 2.1.0): " NEW_VERSION
        CHANGE_TYPE="custom"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "📦 Bumping version: ${YELLOW}$CURRENT_VERSION${NC} → ${GREEN}$NEW_VERSION${NC} (${CHANGE_TYPE})"

# Validate new version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Use X.Y.Z${NC}"
    exit 1
fi

# Update package.json
echo "📝 Updating ha-screenshotter/package.json..."
jq ".version = \"$NEW_VERSION\"" ha-screenshotter/package.json > tmp.json && mv tmp.json ha-screenshotter/package.json

# Update config.yaml
echo "📝 Updating ha-screenshotter/config.yaml..."
sed -i "s/^version: \"$CURRENT_VERSION\"/version: \"$NEW_VERSION\"/" ha-screenshotter/config.yaml

# Verify changes
PACKAGE_VERSION=$(jq -r '.version' ha-screenshotter/package.json)
CONFIG_VERSION=$(grep '^version:' ha-screenshotter/config.yaml | cut -d' ' -f2 | tr -d '"')

if [ "$PACKAGE_VERSION" != "$NEW_VERSION" ] || [ "$CONFIG_VERSION" != "$NEW_VERSION" ]; then
    echo -e "${RED}❌ Version update failed!${NC}"
    echo "package.json: $PACKAGE_VERSION"
    echo "config.yaml: $CONFIG_VERSION"
    exit 1
fi

echo -e "${GREEN}✅ Version files updated successfully${NC}"

# Update changelog
TODAY=$(date +%Y-%m-%d)
echo "📝 Updating CHANGELOG.md..."

# Create temporary changelog entry
cat > /tmp/changelog_entry << EOF

## [$NEW_VERSION] - $TODAY

### Added
- <!-- Add new features here -->

### Changed
- <!-- Add changes here -->

### Fixed
- <!-- Add bug fixes here -->

### Removed
- <!-- Add removals here -->

EOF

# Insert after the header (line 6)
sed -i '6r /tmp/changelog_entry' ha-screenshotter/CHANGELOG.md
rm /tmp/changelog_entry

echo -e "${GREEN}✅ CHANGELOG.md updated with template entry${NC}"

echo ""
echo -e "${YELLOW}📋 TODO: Update the changelog entry with actual changes${NC}"
echo -e "${YELLOW}📋 TODO: Commit and create PR${NC}"

echo ""
echo "🎉 Version bump complete!"
echo -e "   New version: ${GREEN}$NEW_VERSION${NC}"
echo "   Files updated:"
echo "   - ha-screenshotter/package.json"  
echo "   - ha-screenshotter/config.yaml"
echo "   - ha-screenshotter/CHANGELOG.md (template added)"
echo ""
echo -e "${YELLOW}⚠️  Remember to edit ha-screenshotter/CHANGELOG.md with your actual changes before committing!${NC}"