'use strict';

const fs = require('fs');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const path = require('path');

const fixtures = path.resolve(__dirname, '../../network');
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);

async function main() {
    try {
        const credPath = path.join(fixtures, '/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com');
        const cert = fs.readFileSync(path.join(credPath, '/msp/signcerts/Admin@org1.example.com-cert.pem')).toString();
        const key = fs.readFileSync(path.join(credPath, '/msp/keystore/9b5a4dc9f72dd4febf2970d9c47cb0973a6815cc98420d94ecda4a5408bf3e98_sk')).toString();

        const identityLabel = 'Admin@org1.example.com';
        const identity = X509WalletMixin.createIdentity('Org1MSP', cert, key);

        await wallet.import(identityLabel, identity);
    } catch (error) {
        console.log(`Error adding to wallet. ${error}`);
        console.log(error.stack);
    }
}

main().then(() => {
    console.log('Successfully imported Admin@org1.example.com into the wallet');
}).catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});