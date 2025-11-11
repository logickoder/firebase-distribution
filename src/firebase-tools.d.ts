declare module 'firebase-tools' {
  export namespace appdistribution {
    function distribute(
      file: string,
      options: {
        app: string
        token?: string
        groups?: string
        testers?: string
        releaseNotes?: string
        releaseNotesFile?: string
        debug?: boolean
      }
    ): Promise<unknown>
  }
}
