# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-10

### Added

- 🎉 Initial TypeScript implementation of Firebase App Distribution action
- 🎯 **Wildcard pattern support** for file input (e.g., `*.apk`, `**/*.aab`)
- 🔐 Service account authentication via file path
- 🔐 Service account authentication via content (for GitHub secrets)
- 📝 Custom release notes support
- 📝 Release notes from file support
- 📝 Automatic release notes from git commit (default behavior)
- 👥 Distribution to tester groups
- 👥 Distribution to individual testers by email
- 🐛 Debug mode for detailed logging
- 📊 Output capture for console URI, testing URI, and binary download URI
- ✅ Git safe directory configuration
- ✅ Comprehensive error handling and validation
- 📚 Complete documentation (README, MIGRATION, IMPLEMENTATION, WILDCARD_GUIDE)
- 🧪 Example workflow for testing and reference

### Changed

- Migrated from bash script to TypeScript for better maintainability
- Improved error messages with detailed context
- Enhanced logging with step-by-step progress updates

### Security

- Secure handling of service account credentials
- Environment variable isolation for authentication tokens
- Temporary file cleanup for credential content

### Documentation

- Comprehensive README with usage examples
- Migration guide from bash to TypeScript
- Wildcard pattern quick reference guide
- Implementation summary document
- Example workflow file

### Technical Details

- Built with TypeScript 5.9.3
- Uses @actions/core v1.11.1 for GitHub Actions integration
- Uses @actions/exec v1.1.1 for CLI command execution
- Uses glob v11.0.3 for wildcard pattern matching
- Compiled with @vercel/ncc to single dist/index.js file
- Node.js 20+ required

## Migration from Bash Script

This release represents a complete rewrite from the original bash implementation
with the following improvements:

### Feature Comparison

| Feature                           | Bash | TypeScript v1.0.0 |
| --------------------------------- | ---- | ----------------- |
| Single file upload                | ✅   | ✅                |
| **Multiple files with wildcards** | ❌   | ✅                |
| Service account (file)            | ✅   | ✅                |
| Service account (content)         | ✅   | ✅                |
| Custom release notes              | ✅   | ✅                |
| Release notes from file           | ✅   | ✅                |
| Default git commit notes          | ✅   | ✅                |
| Tester groups                     | ✅   | ✅                |
| Individual testers                | ✅   | ✅                |
| Debug mode                        | ✅   | ✅                |
| Output URIs                       | ✅   | ✅                |
| Type safety                       | ❌   | ✅                |
| Modular code                      | ❌   | ✅                |
| Unit testable                     | ❌   | ✅                |

### Breaking Changes

None - Full backward compatibility maintained with bash script

## [Unreleased]

### Planned

- Unit tests for core functionality
- Integration tests with Firebase CLI
- CI/CD pipeline for automated testing
- Support for additional Firebase CLI options
- Retry logic for failed distributions
- Parallel file uploads for better performance
- iOS-specific examples and documentation
- Custom timeout configuration
- Progress indicators for large file uploads

---

## Version History

### Version 1.0.0 (Current)

First stable release with TypeScript implementation and wildcard support.

---

## How to Upgrade

### From Bash Script to v1.0.0

Update your workflow to use the new action with wildcard support:

```yaml
# Old (bash script)
- name: Distribute
  run: |
    export GOOGLE_APPLICATION_CREDENTIALS=${{ secrets.SERVICE_ACCOUNT }}
    firebase appdistribution:distribute app.apk --app ${{ secrets.APP_ID }}

# New (TypeScript with service account)
- name: Distribute
  uses: your-username/firebase-distribution@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.SERVICE_ACCOUNT }}
    file: app.apk
    appId: ${{ secrets.APP_ID }}
```

If distributing multiple files, use wildcard patterns:

```yaml
# Old (multiple steps)
- run: firebase appdistribution:distribute app-arm64.apk ...
- run: firebase appdistribution:distribute app-x86.apk ...

# New (single step with wildcard)
- uses: your-username/firebase-distribution@v1
  with:
    file: 'app-*.apk'
    # ... other inputs
```

Update output references:

```yaml
# Old
echo "FIREBASE_CONSOLE_URI=$CONSOLE_URI" >> $GITHUB_OUTPUT

# New
# Outputs are automatically set by the action
${{ steps.distribute.outputs.firebase-console-uri }}
```

## Support

For issues, questions, or contributions:

- 🐛 Report bugs:
  [GitHub Issues](https://github.com/your-username/firebase-distribution/issues)
- 💬 Discussions:
  [GitHub Discussions](https://github.com/your-username/firebase-distribution/discussions)
- 📖 Documentation: [README.md](README.md)

## Contributors

Thanks to all contributors who helped make this release possible!

---

_For older versions, see
[tags on this repository](https://github.com/your-username/firebase-distribution/tags)._
