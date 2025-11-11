import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { glob } from 'glob'
import * as fs from 'fs'
import * as path from 'path'

const inputs = {
  serviceCredentialsFile: core.getInput('serviceCredentialsFile'),
  serviceCredentialsFileContent: core.getInput('serviceCredentialsFileContent'),
  file: core.getInput('file', { required: true }),
  appId: core.getInput('appId', { required: true }),
  groups: core.getInput('groups'),
  testers: core.getInput('testers'),
  releaseNotes: core.getInput('releaseNotes'),
  releaseNotesFile: core.getInput('releaseNotesFile'),
  includeFileNameInReleaseNotes: core.getBooleanInput(
    'includeFileNameInReleaseNotes'
  ),
  debug: core.getBooleanInput('debug')
}

async function setupGitSafeDirectory(): Promise<void> {
  const workspace = process.env.GITHUB_WORKSPACE
  if (workspace) {
    await exec('git', [
      'config',
      '--global',
      '--add',
      'safe.directory',
      workspace
    ])
  }
}

async function setupAuthentication(): Promise<void> {
  if (inputs.serviceCredentialsFile) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = inputs.serviceCredentialsFile
    core.info('Using service account from file')
  } else if (inputs.serviceCredentialsFileContent) {
    const credentialsPath = 'service_credentials_content.json'
    fs.writeFileSync(credentialsPath, inputs.serviceCredentialsFileContent)
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath
    core.info('Using service account from content')
  } else {
    throw new Error(
      'No authentication method provided. Please provide serviceCredentialsFile or serviceCredentialsFileContent.'
    )
  }
}

async function getDefaultReleaseNotes(): Promise<string> {
  let output = ''
  await exec('git', ['log', '-1', '--pretty=short'], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    }
  })
  return output.trim()
}

function parseOutputLine(line: string): void {
  if (line.includes('View this release in the Firebase console')) {
    const uri = line.replace(/.*: /, '').trim()
    core.setOutput('firebase-console-uri', uri)
    core.info(`Console URI: ${uri}`)
  } else if (line.includes('Share this release with testers who have access')) {
    const uri = line.replace(/.*: /, '').trim()
    core.setOutput('testing-uri', uri)
    core.info(`Testing URI: ${uri}`)
  } else if (line.includes('Download the release binary')) {
    const uri = line.replace(/.*: /, '').trim()
    core.setOutput('binary-download-uri', uri)
    core.info(`Binary Download URI: ${uri}`)
  }
}

async function distributeFile(
  filePath: string,
  fileIndex: number,
  totalFiles: number
): Promise<void> {
  core.info(`Distributing file: ${filePath}`)

  // Handle release notes
  let releaseNotes = inputs.releaseNotes
  if (!releaseNotes && !inputs.releaseNotesFile) {
    releaseNotes = await getDefaultReleaseNotes()
  }

  // If multiple files and feature is enabled, append filename to release notes
  if (totalFiles > 1 && releaseNotes && inputs.includeFileNameInReleaseNotes) {
    const fileName = path.basename(filePath)
    releaseNotes = `${releaseNotes}\n\nFile: ${fileName} (${fileIndex}/${totalFiles})`
  }

  // Build the firebase CLI arguments
  const args = ['appdistribution:distribute', filePath, '--app', inputs.appId]

  if (inputs.groups) {
    args.push('--groups', inputs.groups)
  }

  if (inputs.testers) {
    args.push('--testers', inputs.testers)
  }

  if (inputs.releaseNotesFile) {
    args.push('--release-notes-file', inputs.releaseNotesFile)
  } else if (releaseNotes) {
    args.push('--release-notes', releaseNotes)
  }

  if (inputs.debug) {
    args.push('--debug')
  }

  // Find the firebase CLI binary from the bundled firebase-tools
  const firebaseBin = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'firebase.cmd' : 'firebase'
  )

  // Use npx to run firebase-tools
  const command = fs.existsSync(firebaseBin) ? firebaseBin : 'npx'
  const finalArgs = fs.existsSync(firebaseBin)
    ? args
    : ['firebase-tools', ...args]

  // Execute firebase CLI and capture output
  await exec(command, finalArgs, {
    listeners: {
      stdout: (data: Buffer) => {
        const lines = data.toString().split('\n')
        lines.forEach(line => {
          if (line.trim()) {
            core.info(line)
            parseOutputLine(line)
          }
        })
      },
      stderr: (data: Buffer) => {
        core.error(data.toString())
      }
    }
  })
}

export async function run(): Promise<void> {
  try {
    // Setup git safe directory
    await setupGitSafeDirectory()

    // Setup authentication
    await setupAuthentication()

    // Resolve file pattern (supports wildcards)
    const files = await glob(inputs.file, {
      nodir: true,
      absolute: true
    })

    if (files.length === 0) {
      throw new Error(`No files found matching pattern: ${inputs.file}`)
    }

    core.info(`Found ${files.length} file(s) matching pattern: ${inputs.file}`)

    // Distribute each file
    for (let i = 0; i < files.length; i++) {
      await distributeFile(files[i], i + 1, files.length)
    }

    core.info('✅ Distribution completed successfully')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occurred')
    }
  }
}
