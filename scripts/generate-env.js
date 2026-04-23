const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'prod';

const sourceFile =
  target === 'prod'
    ? path.join(__dirname, '../src/environments/environment.prod.ts')
    : path.join(__dirname, '../src/environments/environment.ts');

const outputFile = path.join(__dirname, '../public/env.js');

const fileContent = fs.readFileSync(sourceFile, 'utf8');

// Estrazione molto semplice dei valori stringa
const appDomainMatch = fileContent.match(/appDomain:\s*['"`](.*?)['"`]/);
const apiUrlMatch = fileContent.match(/apiUrl:\s*['"`](.*?)['"`]/);
const productionMatch = fileContent.match(/production:\s*(true|false)/);

const appDomain = appDomainMatch?.[1] || '';
const apiUrl = apiUrlMatch?.[1] || '';
const production = productionMatch?.[1] === 'true';

const envJs = `window.APP_CONFIG = {
  production: ${production},
  appDomain: '${appDomain}',
  apiUrl: '${apiUrl}'
};
`;

fs.writeFileSync(outputFile, envJs, 'utf8');

console.log(`Creato ${outputFile} da ${sourceFile}`);
