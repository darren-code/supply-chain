'use strict';

module.exports.info = 'Benchmark Callback';
const contractID = 'mycc';
const version = '1.0';

let bc, ctx, clientArgs, clientIdx;

module.exports.init = async function(blockchain, context) {
    bc = blockchain;
    ctx = context;
    clientIdx = context.clientIdx.toString();
};

module.exports.run = function() {
    const myArgs = {
        chaincodeFunction: 'GetAllAssets',
        invokerIdentity: 'admin',
        chaincodeArguments: []
    };
    return bc.bcObj.querySmartContract(ctx, contractID, version, myArgs);
};

module.exports.end = async function() {
    return Promise.resolve();
};

