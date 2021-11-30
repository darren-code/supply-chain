"use strict";

const { FileSystemWallet, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const configdata = JSON.parse(
    fs.readFileSync("../gateway/config.json", "utf8")
);
const ccpPath = path.resolve(
    __dirname,
    configdata["connection_profile_filename"]
);

async function main() {
    try {
        const walletPath = configdata["wallet"];
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists("admin");
        if (!userExists) {
            console.log(
                'An identity for the user "admin" does not exist in the wallet'
            );
            console.log("Run the registerUser.js application before retrying");
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, {
            wallet,
            identity: "admin",
            discovery: { enabled: true, asLocalhost: true },
        });
        const network = await gateway.getNetwork(configdata["channel_name"]);
        const contract = await network.getContract(
            configdata["smart_contract_name"]
        );

        const result = await contract.evaluateTransaction("GetAllSupplies");
        console.log(
            `Transaction has been evaluated, result is : ${result.toString()}`
        );
    } catch (error) {
        console.log(`Failed to submit transaction : ${error}`);
        process.exit(1);
    }
}

main();