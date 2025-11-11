# Release Process

This action uses a release-based distribution model to avoid committing large `dist/` files to the repository.

## How It Works

1. The `dist/` folder is **NOT** committed to the repository (it's in `.gitignore`)
2. When you push a version tag (e.g., `v1.0.0`), the release workflow:
   - Builds the action (`pnpm run package`)
   - Creates a GitHub release with the built files attached
   - Updates the major version tag (e.g., `v1`) to point to the latest release

## Creating a Release

### 1. Update Version

Update the version in `package.json`:

```bash
# For patch releases (bug fixes)
pnpm version patch

# For minor releases (new features)
pnpm version minor

# For major releases (breaking changes)
pnpm version major
```

This will create a git tag automatically.

### 2. Push the Tag

```bash
git push origin main --follow-tags
```

The release workflow will automatically:
- Build the distribution files
- Create a GitHub release
- Attach the built files to the release
- Update the major version tag (e.g., `v1`, `v2`)

## Using the Action

Users can reference your action in three ways:

### 1. Major Version (Recommended)

```yaml
- uses: logickoder/firebase-distribution@v1
```

This automatically gets the latest v1.x.x release. The major version tag is automatically updated when you release new versions.

### 2. Specific Version

```yaml
- uses: logickoder/firebase-distribution@v1.2.3
```

This pins to a specific version for maximum stability.

### 3. Branch (Not Recommended for Production)

```yaml
- uses: logickoder/firebase-distribution@main
```

**Note:** This won't work unless you commit `dist/` to the branch. Only use for development/testing.

## Development Workflow

### Testing Unreleased Changes

To test changes before releasing:

1. Create a development release with a pre-release tag:

```bash
git tag v1.0.0-alpha.1
git push origin v1.0.0-alpha.1
```

2. Reference it in your workflow:

```yaml
- uses: logickoder/firebase-distribution@v1.0.0-alpha.1
```

### Local Development

For local development, you can still build and test:

```bash
# Build the action
pnpm run package

# The dist/ folder will be created locally but won't be committed
```

## Benefits

✅ **Smaller Repository** - No large `dist/` files in version control  
✅ **Cleaner Diffs** - Pull requests only show source code changes  
✅ **Faster Clones** - Repository downloads faster  
✅ **Less Bandwidth** - No repeated downloads of large built files  
✅ **Standard Practice** - Follows GitHub Actions best practices  

## Troubleshooting

### "Action not found" Error

If users get an error that the action can't be found:

1. Ensure you've pushed at least one version tag
2. Check that the release workflow completed successfully
3. Verify the tag follows semantic versioning (e.g., `v1.0.0`)

### Major Version Tag Not Updating

The major version tag (e.g., `v1`) only updates for stable releases. Pre-release versions (alpha, beta, rc) don't update the major version tag.
