'use strict';

const fs = require('fs');
const path = require('path');
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { resolve } = require('path');
const EVENT_NAME = 'chaincodeEvent';

var gateway;
var network;
var contract = null;
var wallet;
var ccp;
var orgMSPID;
const utils = {};
const configdata = JSON.parse(fs.readFileSync('../gateway/config.json', 'utf8'));
const ccpPath = path.resolve(__dirname, configdata["connection_profile_filename"]);

utils.events = async () => {
    const client = gateway.getClient();
    var channel = client.getChannel(configdata["channel_name"]);
    var peers = channel.getChannelPeers();
    if (peers.length == 0) {
        throw new Error("Error after call to channel.getChannelPeers(): Channel has no peers");
    }

    console.log("Connecting to event hub..." + peers[0].getName());
    var channel_event_hub = channel.getChannelEventHub(peers[0].getName());
    channel_event_hub.connect(true);

    let event_monitor = new Promise((resolve, reject) => {
        channel_event_hub.registerChaincodeEvent(configdata["smart_contract_name"], EVENT_NAME, (event, block_num, txnid, status) => {
            console.log("Event payload: " + event.payload.toString());
            console.log(`Block Number: ${block_num}, Transaction ID: ${txnid}, Status: ${status}`);
            console.log("------------------------------------");
        }, (err) => {
            reject(new Error('There was a problem with eventhub in registerTxEvent ::' + err));
        }, { disconnect: false });
    }, (err) => {
        console.log("At creation of event_monitor: Error:" + err.toString());
        throw (err);
    });

    Promise.all([event_monitor]);
}

utils.prepareErrorResponse = (error, code, message) => {
    let errorMsg;
    try {
        let entries = Object.entries(error);
        errorMsg = entries[0][1][0]["message"];
    } catch (exception) {
        errorMsg = null;
    }

    let result = { "code": code, "message": errorMsg? errorMsg : message, "error": error };
    console.log("utils.js:prepareErrorResponse(): " + message);
    console.log(result);
    return result;
}

utils.connectGatewayFromConfig = async () => {
    console.log(">>>connectGatewayFromConfig: ");
    gateway = new Gateway();

    try {
        const walletpath = configdata["wallet"];
        console.log("walletpath = " + walletpath);

        ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        orgMSPID = ccp.client.organization;
        console.log('MSP ID: ' + orgMSPID);

        wallet = new FileSystemWallet(walletpath);
        await wallet.exists("admin");

        console.log('Connect to Fabric gateway.');
        await gateway.connect(ccp, {
            identity: 'admin', wallet: wallet, discovery: { enabled: true, asLocalhost: true }
        });
        console.log('Use network channel: ' + configdata["channel_name"]);

        network = await gateway.getNetwork(configdata["channel_name"]);
        console.log('Use ' + configdata["smart_contract_name"] + ' smart contract.');

        contract = await network.getContract(configdata["smart_contract_name"]);
    } catch (error) {
        console.log('Error connecting to Fabric network. ' + error.toString());
    }

    return contract;
}

utils.submitTx = async(contract, txName, ...args) => {
    console.log(">>>utils.submitTx..." + txName + " (" + args + ")");
    let result = contract.submitTransaction(txName, ...args);
    return result.then(response => {
        console.log('Transaction submitted successfully; Response: ', response.toString());
        return Promise.resolve(response.toString());
    }, (error) => {
        console.log('utils.js: Error: ' + error.toString());
        return Promise.reject(error);
    });
}

utils.evalTx = async(contract, txName, ...args) => {
    console.log(">>>utils.evalTx..." + txName + " (" + args + ")");
    let result = contract.evaluateTransaction(txName, ...args);
    return result.then(response => {
        console.log('Transaction submitted successfully; Response: ', response.toString());
        return Promise.resolve(response.toString());
    }, (error) => {
        console.log('utils.js: Error: ' + error.toString());
        return Promise.reject(error);
    });
}

utils.registerUser = async (userid, userpwd, items, adminIdentity) => {
    console.log("\n------------ utils.registerUser ---------------");
    console.log("\n userid: " + userid + ", pwd: " + userpwd + ", usertype: " + items + ", identity: " + adminIdentity);

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: adminIdentity, discovery: { enabled: false, asLocalhost: true } });

    const orgs = ccp.organizations;
    const CAs = ccp.certificateAuthorities;
    const fabricCAKey = orgs[orgMSPID].certificateAuthorities[0];
    const caURL = CAs[fabricCAKey].url;
    const ca = new FabricCAServices(caURL, { trustedRoots: [], verify: false });

    var newUserDetails = {
        enrollmentID: userid,
        enrollmentSecret: userpwd,
        role: "client",
        affiliation: orgMSPID.toLowerCase(),
        attrs: [{
            "name": "items",
            "value": items,
            "ecert": true,
        }],
        maxEnrollments: 1
    };

    return ca.register(newUserDetails, gateway.getCurrentIdentity()).then(newPwd => {
        console.log('\n Secret returned: ' + newPwd);
        return {
            message: 'Successfully register new user',
            enrollmentID: userid,
            enrollmentSecret: userpwd ? userpwd : newPwd
        }
        return newPwd;
    }, error => {
        console.log('Error in register(): ERROR returned: ' + error.toString());
        return Promise.reject(error);
    });
}

utils.enrollUser = async (userid, userpwd, items) => {
    console.log("\n------------ utils.enrollUser -----------------");
    console.log("userid: " + userid + ", pwd: " + userpwd + ", usertype: " + usertype);

    const orgs = ccp.organizations;
    const CAs = ccp.certificateAuthorities;
    const fabricCAKey = orgs[orgMSPID].certificateAuthorities[0];
    const caURL = CAs[fabricCAKey].url;
    const ca = new FabricCAServices(caURL, { trustedRoots: [], verify: false });

    var newUserDetails = {
        enrollmentID: userid,
        enrollmentSecret: userpwd,
        attrs: [{
            "name": "items",
            "value": items,
            "ecert": true,
        }]
    };

    return ca.enroll(newUserDetails).then(enrollment => {
        var identity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
        return wallet.import(userid, identity).then(notused => {
            return {
                message: 'Successfully enroll user ' + userid + ' and import into the wallet!'
            };
        }, error => {
            console.log("error in wallet.import\n" + error.toString());
            throw error;
        });
    }, error => {
        console.log('Error in enrollment ' + error.toString());
        throw error;
    });
}

utils.setUserContext = async (userid, pwd) => {
    console.log('\n>>>setUserContext...');

    const userExists = await wallet.exists(userid);
    if (!userExists) {
        console.log("An identity for the user: " + userid + " does not exist in the wallet");
        console.log('Enroll user before retrying');
        throw("Identity does not exist for userid: " + userid);
    }

    try {
        console.log('Connect to Fabric gateway with userid: ' + userid);
        let userGateway = new Gateway();
        await userGateway.connect(ccp, { identity: userid, wallet: wallet, discovery: { enabled: true, asLocalhost: true } });
        
        network = await userGateway.getNetwork(configdata["channel_name"]);
        contract = await network.getContract(configdata["smart_contract_name"]);

        return contract;
    } catch (error) {
        throw(error);
    }
}

utils.isUserEnrolled = async (userid) => {
    return wallet.exists(userid).then(result => {
        return {
            message: result
        };
    }, error => {
        console.log("error in wallet.exists\n" + error.toString());
        throw error;
    });
}

utils.getUser = async (userid, adminIdentity) => {
    console.log(">>>getUser...");
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: adminIdentity, discovery: { enabled: false, asLocalhost: true } });

    let client = gateway.getClient();
    let fabric_ca_client = client.getCertificateAuthority();
    let idService = fabric_ca_client.newIdentityService();
    let user = await idService.getOne(userid, gateway.getCurrentIdentity());
    let result = {"id": userid};

    if (userid == "admin" || userid == "Admin@org1.example.com" || userid == " Admin@org2.example.com") {
        result.usertype = userid;
    } else {
        let j = 0;
        while (user.result.attrs[j].name !== "usertype") j++;
        result.usertype = user.result.attrs[j].value;
    }

    console.log(result);
    return Promise.resolve(result);
}

utils.getAllUsers = async (adminIdentity) => {
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: adminIdentity, discovery: { enabled: false, asLocalhost: true } });

    let client = gateway.getClient();
    let fabric_ca_client = client.getCertificateAuthority();
    let idService = fabric_ca_client.newIdentityService();
    let user = gateway.getCurrentIdentity();
    let userList = await idService.getAll(user);
    let identities = userList.result.identities;
    let result = [];
    let tmp;
    let attributes;

    for (var i = 0; i < identities.length; i++) {
        tmp = {};
        tmp.id = identities[i].id;
        tmp.usertype = "";
        tmp.agent = "";
        tmp.items = 0;

        if (tmp.id == "admin" || tmp.id == "Admin@org1.example.com" || tmp.id == " Admin@org2.example.com") {
            tmp.usertype = tmp.id;
        } else {
            attributes = identities[i].attrs;
            for (var j = 0; j < attributes.length; j++) {
                if (attributes[j].name == "usertype") {
                    tmp.usertype = attributes[j].value;
                    break;
                }
                if (attributes[j].name == "agent") {
                    tmp.agent = attributes[j].agent;
                    break;
                }
                if (attributes[j].name == "items") {
                    tmp.items = attributes[j].items;
                    break;
                }
            }
        }
        result.push(tmp);
    }
    return result;
}

utils.updateUserAttributes = async (userId, adminIdentity, items) => {
    console.log(">>>getUser...");
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: adminIdentity, discovery: { enabled: false, asLocalhost: true } });

    let client = gateway.getClient();
    let fabric_ca_client = client.getCertificateAuthority();
    let idService = fabric_ca_client.newIdentityService();

    var userDetails = {
        enrollmentID: userId,
        // enrollmentSecret: userpwd,
        // role: "client",
        affiliation: orgMSPID.toLowerCase(),
        attrs: [{
            "name": "items",
            "value": items,
            "ecert": true,
        }],
        maxEnrollments: 1
    };

    return await idService.update(userId, userDetails, gateway.getCurrentIdentity());
}

module.exports = utils;