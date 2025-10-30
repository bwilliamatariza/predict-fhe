const fs = require('fs');
const path = require('path');

function main() {
  const deployPath = path.join(__dirname, '..', 'deployments', 'sepolia', 'SecretPredict.json');
  const outPath = path.join(__dirname, '..', 'frontend', 'src', 'config', 'contracts.ts');

  const content = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
  const address = content.address;
  const abi = content.abi;

  const ts = `// Auto-generated from deployments/sepolia/SecretPredict.json\n` +
    `export const CONTRACT_ADDRESS: \`0x\${string}\` = '${address}';\n\n` +
    `export const CONTRACT_ABI: any[] = ${JSON.stringify(abi, null, 2)};\n`;

  fs.writeFileSync(outPath, ts, 'utf8');
  console.log('Wrote ABI and address to', outPath);
}

main();

