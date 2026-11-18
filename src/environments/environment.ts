export const environment = {
  production: false,
  baseApiUrl: 'http://localhost:8080/luigi/vasile/personal/api',
  //baseApiUrl:'https://vasilepersonalsitebe.onrender.com/luigi/vasile/personal/api'

  // snapshot su Google Drive: vuoto = disattivato (vedi environment.prod.ts)
  calendarioSnapshot: {
    driveFileId: '1MjF9KZAtW6jLXVfbdj6kTEQYQcjcLnVT',
    apiKey: 'AIzaSyCCzllectRz90TMTfp0RkJ0GMOQy_pC5Y8',
    timeoutMs: 15000
  }
};
