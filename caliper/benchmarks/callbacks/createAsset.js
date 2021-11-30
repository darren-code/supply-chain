'use strict';

module.exports.info = 'Benchmark Callback';
const contractID = 'mycc';
const version = '1.0';

let bc, ctx, clientIdx;
let i = 0;

module.exports.init = async function(blockchain, context) {
    bc = blockchain;
    ctx = context;
    clientIdx = context.clientIdx.toString();
};

module.exports.run = function() {
    i++;
    const myArgs = {
        chaincodeFunction: 'CreateAsset',
        invokerIdentity: 'admin',
        chaincodeArguments: [`${clientIdx}_${i}_create`, 'test', '10', 'test', '100']
    };
    return bc.bcObj.invokeSmartContract(ctx, contractID, version, myArgs);
};

module.exports.end = async function() {
    while (i > 0) {
        try {
            const assetID = `${clientIdx}_${i}_create`;
            console.log(`Client ${clientIdx}: Deleting Asset ${assetID}`);
            const myArgs = {
                chaincodeFunction: 'DeleteAsset',
                invokerIdentity: 'admin',
                chaincodeArguments: [assetID]
            };
            await bc.bcObj.invokeSmartContract(ctx, contractID, version, myArgs);
            i--;
        } catch (error) {
            console.log(`Client ${clientIdx}: Smart Contract threw error ${error}`);
        }
    }
};

