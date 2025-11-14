# Firebase App Distribution Action

A GitHub Action to distribute your Android and iOS apps to testers using
Firebase App Distribution. Supports wildcard file patterns for easy distribution
of multiple builds (e.g., APK splits).

> **Note:** This action bundles Firebase CLI automatically - no manual
> installation required!  
> For versioning and release information, see [RELEASE.md](RELEASE.md).

## Features

- 📦 Distribute Android (APK, AAB) and iOS (IPA) apps to Firebase App
  Distribution
- 🎯 Support for wildcard patterns to upload multiple files (perfect for APK
  splits)
- 🔐 Service account authentication (file or content)
- 📝 Automatic release notes from git history or custom notes
- 👥 Target specific tester groups or individual testers
- 📊 Get distribution URLs as action outputs

## Prerequisites

- Firebase project set up
- Firebase App Distribution enabled for your app
- Service account credentials configured

## Authentication

This action uses Firebase service account authentication for secure, long-term
access.

### Setting up Service Account

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON key file
6. Add the content as a GitHub secret

## Usage

### Basic Usage

```yaml
- name: Distribute to Firebase App Distribution
  uses: logickoder/firebase-distribution@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: app/build/outputs/apk/release/app-release.apk
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: testers
```

### Upload Multiple Files with Wildcards

Perfect for distributing APK splits or multiple variants. See the
[Wildcard Pattern Guide](WILDCARD_GUIDE.md) for more pattern examples.

```yaml
- name: Distribute APK Splits
  uses: logickoder/firebase-distribution@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: 'app/build/outputs/apk/release/*.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: internal-testers
    releaseNotes: 'New build with split APKs for different architectures'
    # Each file will have its name appended to release notes by default
    # Set to 'false' to disable: includeFileNameInReleaseNotes: false
```

### Complete Example with Custom Release Notes

```yaml
name: Distribute App

on:
  push:
    branches: [main]

jobs:
  distribute:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Build APK
        run: ./gradlew assembleRelease

      - name: Distribute to Firebase
        uses: logickoder/firebase-distribution@v1
        with:
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          file: 'app/build/outputs/apk/**/*.apk'
          appId: ${{ secrets.FIREBASE_APP_ID }}
          groups: 'qa-team, beta-testers'
          releaseNotes: |
            🚀 New features:
            - Feature A
            - Feature B

            🐛 Bug fixes:
            - Fixed issue X
```

### Using Release Notes from File

```yaml
- name: Distribute with Release Notes File
  uses: logickoder/firebase-distribution@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: app/build/outputs/apk/release/app-release.apk
    appId: ${{ secrets.FIREBASE_APP_ID }}
    testers: 'tester1@example.com, tester2@example.com'
    releaseNotesFile: RELEASE_NOTES.txt
```

### Using Service Account File Path

```yaml
- name: Distribute with Service Account File
  uses: logickoder/firebase-distribution@v1
  with:
    serviceCredentialsFile: ./firebase-service-account.json
    file: '**/*.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: testers
```

### Multi-Repository Workflow

When you have multiple repositories checked out in your workflow:

```yaml
- name: Checkout main app
  uses: actions/checkout@v4
  with:
    path: main-app

- name: Checkout library
  uses: actions/checkout@v4
  with:
    repository: org/library
    path: library

- name: Build main app
  run: ./gradlew assembleRelease
  working-directory: main-app

- name: Distribute from main-app directory
  uses: logickoder/firebase-distribution@v1
  with:
    workingDirectory: main-app
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: 'app/build/outputs/apk/release/*.apk'
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: testers
```

## Inputs

| Name                            | Description                                                                      | Required | Default           |
| ------------------------------- | -------------------------------------------------------------------------------- | -------- | ----------------- |
| `file`                          | Path to binary file(s) to upload. Supports wildcards (e.g., `*.apk`, `**/*.aab`) | Yes      |                   |
| `workingDirectory`              | Working directory to run the action in (for multi-repo workflows)                | No       | `.`               |
| `appId`                         | Firebase App ID (found in Firebase console)                                      | Yes      |                   |
| `serviceCredentialsFile`        | Path to service account JSON file                                                | No\*     |                   |
| `serviceCredentialsFileContent` | Content of service account JSON file                                             | No\*     |                   |
| `groups`                        | Comma-separated list of tester group names                                       | No       |                   |
| `testers`                       | Comma-separated list of tester email addresses                                   | No       |                   |
| `releaseNotes`                  | Release notes text                                                               | No       | Latest git commit |
| `releaseNotesFile`              | Path to file containing release notes                                            | No       |                   |
| `includeFileNameInReleaseNotes` | Include filename in release notes when distributing multiple files               | No       | `true`            |
| `debug`                         | Enable debug mode for detailed logging                                           | No       | `false`           |

\*Either `serviceCredentialsFile` or `serviceCredentialsFileContent` must be
provided

## Outputs

| Name                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `firebase-console-uri` | URL to view the release in Firebase Console       |
| `testing-uri`          | URL to share with testers for downloading the app |
| `binary-download-uri`  | Direct download URL for the binary                |

### Using Outputs

```yaml
- name: Distribute to Firebase
  id: firebase
  uses: logickoder/firebase-distribution@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: app/build/outputs/apk/release/app-release.apk
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: testers

- name: Send notification
  run: |
    echo "Console: ${{ steps.firebase.outputs.firebase-console-uri }}"
    echo "Testing: ${{ steps.firebase.outputs.testing-uri }}"
    echo "Download: ${{ steps.firebase.outputs.binary-download-uri }}"
```

## Wildcard Patterns

The action uses [glob](https://github.com/isaacs/node-glob) patterns. Here are
some examples:

- `*.apk` - All APK files in current directory
- `**/*.apk` - All APK files in current directory and subdirectories
- `app/build/outputs/apk/**/*.apk` - All APKs in specific path
- `*.{apk,aab}` - All APK and AAB files
- `app-*-release.apk` - Files matching the pattern

See [WILDCARD_GUIDE.md](WILDCARD_GUIDE.md) for comprehensive pattern examples.

## Setting up Secrets

### Required Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables >
Actions):

1. `FIREBASE_SERVICE_ACCOUNT` - Your service account JSON content
2. `FIREBASE_APP_ID` - Your Firebase App ID (e.g.,
   `1:1234567890:android:abcdef`)

### Finding Your Firebase App ID

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings
4. Scroll to "Your apps" section
5. Copy the App ID

## Troubleshooting

### Common Issues

1. **No files found matching pattern**
   - Check that your build artifacts exist before running this action
   - Verify the file path is correct
   - Use `ls` or `find` commands to debug file locations

2. **Authentication failed**
   - Ensure your service account has the "Firebase App Distribution Admin" role
   - Verify the JSON content is properly formatted
   - Check that the service account JSON is for the correct Firebase project

3. **App ID not found**
   - Verify the App ID format (should be like `1:1234567890:android:abcdef`)
   - Ensure App Distribution is enabled for your app in Firebase Console

4. **No testers or groups specified**
   - At least one of `groups` or `testers` should be specified
   - Group names are case-sensitive

### Debug Mode

Enable debug mode for detailed logging:

```yaml
- uses: logickoder/firebase-distribution@v1
  with:
    serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    file: app.apk
    appId: ${{ secrets.FIREBASE_APP_ID }}
    groups: testers
    debug: true
```

## Versioning

This action follows [semantic versioning](https://semver.org/). You can
reference it in three ways:

- **`@v1`** (Recommended) - Automatically uses the latest v1.x.x release
- **`@v1.2.3`** (Stable) - Pins to an exact version for maximum stability
- **`@main`** (Not recommended) - Uses the latest commit (may be unstable)

For most use cases, using `@v1` is recommended as it provides automatic updates
while maintaining compatibility.

> **📖 For maintainers:** See [RELEASE.md](RELEASE.md) for detailed information
> about the release process, creating new versions, and how the distribution
> system works.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Related Actions

- [Firebase App Distribution Official](https://github.com/wzieba/Firebase-Distribution-Github-Action)
- [Android Build Actions](https://github.com/marketplace?type=actions&query=android+build)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
