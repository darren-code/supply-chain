#!/bin/bash

echo "===================== Sample network end-to-end test ====================="
CHANNEL_NAME="mychannel"
DELAY=3
TIMEOUT=90
COUNTER=1
MAX_RETRY=10
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/supply-chain"

. scripts/utils.sh

createChannel() {
	setGlobals 0 1
	
	set -x
    peer channel create -o orderer1.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/$CHANNEL_NAME.tx --outputBlock ./$CHANNEL_NAME.block --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    set +x

	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

joinChannel () {
	for org in 1 2; do
	    for peer in 1 2; do
		joinChannelWithRetry $peer $org
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME' ===================== "
		sleep $DELAY
		echo
	    done
	done
}

echo "Creating channel..."
createChannel

echo "Having all peers join the channel..."
joinChannel

echo "Updating anchor peers for org1..."
updateAnchorPeers 1 1
echo "Updating anchor peers for org2..."
updateAnchorPeers 1 2

echo "Installing chaincode on peer1.org1..."
installChaincode 1 1
echo "Install chaincode on peer1.org2..."
installChaincode 1 2
echo "Installing chaincode on peer2.org1..."
installChaincode 2 1
echo "Install chaincode on peer2.org2..."
installChaincode 2 2

echo "Instantiating chaincode on peer2.org2..."
instantiateChaincode 2 2

echo
echo "===================== Sample network end-to-end test completed ====================="
exit 0