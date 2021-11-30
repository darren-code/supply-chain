'use strict';

module.exports.info = 'Benchmark Callback';
const contractID = 'mycc';
const version = '1.0';

let bc, ctx, clientArgs, clientIdx;
let i = 0;

module.exports.init = async function(blockchain, context, args) {
    bc = blockchain;
    ctx = context;
    clientArgs = args;
    clientIdx = context.clientIdx.toString();

    for (i = 0; i < clientArgs.assets; i++) {
        try {
            const assetID = `${clientIdx}_${i}_delete`;
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

module.exports.run = function() {
    i--;
    const myArgs = {
        chaincodeFunction: 'DeleteAsset',
        invokerIdentity: 'admin',
        chaincodeArguments: [`${clientIdx}_${i}_delete`]
    };
    return bc.bcObj.invokeSmartContract(ctx, contractID, version, myArgs);
};

module.exports.end = function() {
    return Promise.resolve();
};

