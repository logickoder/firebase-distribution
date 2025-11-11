import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { glob } from 'glob'
import * as fs from 'fs'
import * as firebase from 'firebase-tools'

const inputs = {
  serviceCredentialsFile: core.getInput('serviceCredentialsFile'),
  serviceCredentialsFileContent: core.getInput('serviceCredentialsFileContent'),
  file: core.getInput('file', { required: true }),
  appId: core.getInput('appId', { required: true }),
  groups: core.getInput('groups'),
  testers: core.getInput('testers'),
  releaseNotes: core.getInput('releaseNotes'),
  releaseNotesFile: core.getInput('releaseNotesFile'),
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

async function distributeFile(filePath: string): Promise<void> {
  core.info(`Distributing file: ${filePath}`)

  // Handle release notes
  let releaseNotes = inputs.releaseNotes
  if (!releaseNotes && !inputs.releaseNotesFile) {
    releaseNotes = await getDefaultReleaseNotes()
  }

  // Build the firebase CLI options
  const options = {
    app: inputs.appId,
    token: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    groups: inputs.groups || undefined,
    testers: inputs.testers || undefined,
    releaseNotes: inputs.releaseNotesFile ? undefined : releaseNotes,
    releaseNotesFile: inputs.releaseNotesFile || undefined,
    debug: inputs.debug || undefined
  }

  try {
    // Use firebase-tools programmatic API
    const result = await firebase.appdistribution.distribute(filePath, options)

    // Log the result
    if (result) {
      core.info(JSON.stringify(result, null, 2))

      // Try to extract URIs from the result if available
      if (typeof result === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultObj = result as Record<string, any>
        if (resultObj.consoleUri) {
          core.setOutput('firebase-console-uri', resultObj.consoleUri)
          core.info(`Console URI: ${resultObj.consoleUri}`)
        }
        if (resultObj.testingUri) {
          core.setOutput('testing-uri', resultObj.testingUri)
          core.info(`Testing URI: ${resultObj.testingUri}`)
        }
        if (resultObj.binaryDownloadUri) {
          core.setOutput('binary-download-uri', resultObj.binaryDownloadUri)
          core.info(`Binary Download URI: ${resultObj.binaryDownloadUri}`)
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to distribute ${filePath}: ${error.message}`)
    }
    throw error
  }
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
    for (const file of files) {
      await distributeFile(file)
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
