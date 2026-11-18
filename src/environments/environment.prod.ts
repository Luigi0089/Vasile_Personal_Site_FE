export const environment = {
  production: true,
  baseApiUrl:'https://api.luigivasile.com/luigi/vasile/personal/api',

  /*
   * Snapshot pubblico del calendario su Google Drive (lettura immediata mentre il backend si avvia).
   * Disattivato finché fileId e apiKey sono vuoti: in quel caso il calendario usa solo il backend.
   * L'apiKey è PUBBLICA per natura (finisce nel bundle): va limitata in Google Cloud Console
   * alla sola "Google Drive API" e ai referrer HTTP del sito. Nessun segreto qui.
   */
  calendarioSnapshot: {
    driveFileId: '1MjF9KZAtW6jLXVfbdj6kTEQYQcjcLnVT',
    apiKey: 'AIzaSyCCzllectRz90TMTfp0RkJ0GMOQy_pC5Y8',
    timeoutMs: 4000
  }
};
