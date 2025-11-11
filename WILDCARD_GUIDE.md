# Wildcard Pattern Quick Reference

This guide provides examples of wildcard patterns you can use with the `file`
input parameter.

## Basic Patterns

### Single File (No Wildcard)

```yaml
file: app/build/outputs/apk/release/app-release.apk
```

Matches: Exactly one specific file

### All Files in Directory

```yaml
file: 'app/build/outputs/apk/release/*.apk'
```

Matches: All `.apk` files in the `release` directory

### All Files Recursively

```yaml
file: '**/*.apk'
```

Matches: All `.apk` files in any subdirectory from the workspace root

### Multiple Extensions

```yaml
file: 'app/build/outputs/**/*.{apk,aab}'
```

Matches: All `.apk` and `.aab` files in any subdirectory under
`app/build/outputs/`

## Real-World Examples

### APK Splits

Common for Android apps with multiple architectures:

```yaml
file: 'app/build/outputs/apk/release/app-*-release.apk'
```

Matches:

- `app-arm64-v8a-release.apk`
- `app-armeabi-v7a-release.apk`
- `app-x86-release.apk`
- `app-x86_64-release.apk`
- `app-universal-release.apk`

### Multiple Flavors

If you have different product flavors:

```yaml
file: 'app/build/outputs/apk/*/release/*.apk'
```

Matches:

- `app/build/outputs/apk/free/release/app-free-release.apk`
- `app/build/outputs/apk/pro/release/app-pro-release.apk`
- `app/build/outputs/apk/enterprise/release/app-enterprise-release.apk`

### Specific Build Variants

```yaml
file: 'app/build/outputs/apk/{free,pro}/release/*.apk'
```

Matches only `free` and `pro` flavors, excluding others

### AAB and APK

Distribute both bundle and APK:

```yaml
file: 'app/build/outputs/**/*-release.{apk,aab}'
```

## Pattern Syntax

### `*` - Matches any characters except `/`

```yaml
file: '*.apk'          # app.apk, test.apk
file: 'app-*.apk'      # app-v1.apk, app-debug.apk
file: '*-release.apk'  # app-release.apk, test-release.apk
```

### `**` - Matches any characters including `/`

```yaml
file: '**/*.apk'              # Any .apk in any subdirectory
file: 'app/**/release/*.apk'  # Any .apk in any release folder under app/
```

### `{a,b,c}` - Matches any of the patterns

```yaml
file: 'app-{arm64,x86}.apk'       # app-arm64.apk OR app-x86.apk
file: '*.{apk,aab,ipa}'           # Any with these extensions
file: '{dev,staging,prod}/*.apk'  # Any env folder
```

### `[abc]` - Matches any character in brackets

```yaml
file: 'app-v[123].apk'  # app-v1.apk, app-v2.apk, app-v3.apk
file: 'app-[a-z].apk'   # app-a.apk, app-b.apk, ..., app-z.apk
```

### `!(pattern)` - Matches anything except the pattern

```yaml
file: 'app/build/outputs/apk/!(debug)/**/*.apk'
```

Matches all APKs except those in debug folders

## GitHub Actions Examples

### Example 1: All Release APKs

```yaml
- name: Distribute All Release Builds
  uses: logickoder/firebase-distribution-with-wildcards@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: '**/release/*.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: qa-team
```

### Example 2: Specific Architecture Splits

```yaml
- name: Distribute ARM Builds Only
  uses: logickoder/firebase-distribution-with-wildcards@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: 'app/build/outputs/apk/release/app-arm*-release.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: arm-testers
```

### Example 3: Multiple Build Types

```yaml
- name: Distribute Staging and Production
  uses: logickoder/firebase-distribution-with-wildcards@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: 'app/build/outputs/apk/{staging,production}/release/*.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: internal-testers
```

### Example 4: All Builds Except Debug

```yaml
- name: Distribute Non-Debug Builds
  uses: logickoder/firebase-distribution-with-wildcards@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: 'app/build/outputs/apk/!(debug)/**/*.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: testers
```

## Tips

### 1. Quote Patterns

Always quote patterns containing special characters:

```yaml
file: '*.apk'      # ✅ Good
file: *.apk        # ❌ May cause YAML parsing issues
```

### 2. Test Patterns Locally

Before using in CI/CD, test your patterns locally:

```bash
# PowerShell
Get-ChildItem -Path "**/*.apk" -Recurse

# Bash
find . -name "*.apk"
```

### 3. Use Absolute Paths

Patterns are resolved relative to the workspace root. Be specific:

```yaml
file: 'app/build/**/*.apk'  # ✅ Specific
file: '**/*.apk'            # ⚠️ May match too many files
```

### 4. Check Build Output

Verify files exist before distribution:

```yaml
- name: List APK files
  run: |
    echo "Files that will be distributed:"
    ls -R app/build/outputs/apk/

- name: Distribute
  uses: logickoder/firebase-distribution-with-wildcards@v1
  with:
    file: 'app/build/outputs/apk/**/*.apk'
    # ... other inputs
```

### 5. Handle No Matches

The action will fail if no files match the pattern. This is by design to catch
build issues early.

## Common Mistakes

### ❌ Forgetting Quotes

```yaml
file: *.apk  # YAML may interpret this incorrectly
```

### ✅ Use Quotes

```yaml
file: '*.apk'
```

### ❌ Too Broad Pattern

```yaml
file: '**/*' # Matches EVERYTHING
```

### ✅ Be Specific

```yaml
file: '**/*.apk' # Only APK files
```

### ❌ Wrong Directory

```yaml
file: 'build/outputs/**/*.apk' # Missing 'app/' prefix
```

### ✅ Correct Path

```yaml
file: 'app/build/outputs/**/*.apk'
```

## Pattern Testing Tool

You can test patterns using Node.js glob directly:

```javascript
const { glob } = require('glob')

// Test your pattern
glob('app/build/outputs/apk/**/*.apk').then(files => {
  console.log('Matched files:', files)
})
```

Or use the provided test action in your workflow:

```yaml
- name: Test Pattern
  run: |
    node -e "
    const { glob } = require('glob');
    glob('${{ inputs.file }}').then(files => {
      console.log('Found', files.length, 'files');
      files.forEach(f => console.log(' -', f));
    });
    "
```

## Documentation

For more details on glob patterns, see:

- [Glob Library Documentation](https://github.com/isaacs/node-glob)
- [GitHub Actions - Expression Syntax](https://docs.github.com/en/actions/learn-github-actions/expressions)

## Need Help?

If your pattern isn't matching as expected:

1. Enable debug mode: `debug: true`
2. Add a step to list files before distribution
3. Test the pattern locally first
4. Check for typos in file paths
5. Verify files are built before the distribution step
