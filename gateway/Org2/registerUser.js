'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection-org2.json');

async function main() {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user2');
        if (userExists) {
            console.log('An identity for the user "user2" already exists in the wallet');
            return;
        }

        const adminExists = await wallet.exists('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();
        const secret = await ca.register({ affiliation: 'org2.department1', enrollmentID: 'user2', role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: 'user2', enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org2MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import('user2', userIdentity);
        console.log('Successfully registered and enrolled admin user "user2" and imported it into the wallet');
    } catch (error) {
        console.error(`Failed to register user "user2": ${error}`);
        process.exit(1);
    }
}

main();