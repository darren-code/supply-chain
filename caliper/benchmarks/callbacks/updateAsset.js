'use strict';

module.exports.info = 'Benchmark Callback';
const contractID = 'mycc';
const version = '1.0';

let bc, ctx, clientArgs, clientIdx;

const Crypto = require('crypto');

function generateRandomNumber() {
    return Math.floor(Math.random() * 1000);
}

function generateRandomString(size = 10) {
    return Crypto.randomBytes(size).toString('base64').slice(0, size);
}

module.exports.init = async function(blockchain, context, args) {
    bc = blockchain;
    ctx = context;
    clientArgs = args;
    clientIdx = context.clientIdx.toString();

    for (let i = 0; i < clientArgs.assets; i++) {
        try {
            const assetID = `${clientIdx}_${i}_update`;
            console.log(`Client ${clientIdx}: Creating Asset ${assetID}`);
            const myArgs = {
                chaincodeFunction: 'CreateAsset',
                invokerIdentity: 'admin',
                chaincodeArguments: [assetID, 'test', '10', 'test', '100']
            };
            await bc.bcObj.invokeSmartContract(ctx, contractID, version, myArgs);
        } catch (error) {
            console.log(`Client ${clientIdx}: Smart Contract threw error ${error}`);
        }
    }
};

let randomId = 0;
module.exports.run = function() {
    if (randomId >= clientArgs.assets) randomId = 0;
    const randomNumber = generateRandomNumber().toString();
    const randomString = generateRandomString();
    const myArgs = {
        chaincodeFunction: 'UpdateAsset',       
        invokerIdentity: 'admin',
        chaincodeArguments: [`${clientIdx}_${randomId}_update`, randomString, randomNumber, randomString, randomNumber]
    };
    randomId++;
    return bc.bcObj.invokeSmartContract(ctx, contractID, version, myArgs);
};

module.exports.end = async function() {
    for (let i = 0; i < clientArgs.assets; i++) {
        try {
            const assetID = `${clientIdx}_${i}_update`;
            console.log(`Client ${clientIdx}: Deleting Asset ${assetID}`);
            const myArgs = {
                chaincodeFunction: 'DeleteAsset',
                invokerIdentity: 'admin',
                chaincodeArguments: [assetID]
            };
            await bc.bcObj.invokeSmartContract(ctx, contractID, version, myArgs);
        } catch (error) {
            console.log(`Client ${clientIdx}: Smart Contract threw error ${error}`);
        }
    }
};