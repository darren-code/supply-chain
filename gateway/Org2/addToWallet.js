'use strict';

const fs = require('fs');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const path = require('path');

const fixtures = path.resolve(__dirname, '../../network');
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);

async function main() {
    try {
        const credPath = path.join(fixtures, '/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com');
        const cert = fs.readFileSync(path.join(credPath, '/msp/signcerts/Admin@org2.example.com-cert.pem')).toString();
        const key = fs.readFileSync(path.join(credPath, '/msp/keystore/5fff07c6e2226c9b8e8d895d406149d780a86e47ae4f0af62e767295ca198c09_sk')).toString();

        const identityLabel = 'Admin@org2.example.com';
        const identity = X509WalletMixin.createIdentity('Org2MSP', cert, key);

        await wallet.import(identityLabel, identity);
    } catch (error) {
        console.log(`Error adding to wallet. ${error}`);
        console.log(error.stack);
    }
}

main().then(() => {
    console.log('Successfully imported Admin@org2.example.com into the wallet');
}).catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});