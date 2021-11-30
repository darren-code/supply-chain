'use strict';

module.exports.info = 'Benchmark Callback';
const contractID = 'mycc';
const version = '1.0';

let bc, ctx, clientArgs, clientIdx;

module.exports.init = async function(blockchain, context, args) {
    bc = blockchain;
    ctx = context;
    clientArgs = args;
    clientIdx = context.clientIdx.toString();
};

module.exports.run = function() {
    const randomId = Math.floor(Math.random() * clientArgs.assets);
    const myArgs = {
        chaincodeFunction: 'GetAssetHistory',
        invokerIdentity: 'admin',
        chaincodeArguments: [`${clientIdx}_${randomId}`]
    };
    return bc.bcObj.querySmartContract(ctx, contractID, version, myArgs);
};

module.exports.end = async function() {
    for (let i = 0; i < clientArgs.assets; i++) {
        try {
            const assetID = `${clientIdx}_${i}`;
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

