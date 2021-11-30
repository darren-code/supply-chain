export FABRIC_CFG_PATH=${PWD}

function printHelp() {
  echo "Usage: "
  echo "  sample-network.sh <mode>"
  echo "    <mode> - one of 'up' or 'down'"
  echo "      - 'up' - bring up the network with docker-compose up"
  echo "      - 'down' - clear the network with docker-compose down"
}

function askProceed() {
  read -p "Continue? [Y/n] " ans
  case "$ans" in
  y | Y | "")
    echo "proceeding ..."
    ;;
  n | N)
    echo "exiting..."
    exit 1
    ;;
  *)
    echo "invalid response"
    askProceed
    ;;
  esac
}

function networkDown() {
  docker stop $(docker ps -aq)
  docker rm -f $(docker ps -aq)
  docker system prune
  docker volume prune
  docker network prune
  docker rmi -f $(docker images | grep mycc | awk '{print $3}')
}

function networkUp() {
  export COMPOSE_PROJECT_NAME="net"
  export IMAGE_TAG="latest"
  export SYS_CHANNEL="byfn-sys-channel"

  docker-compose -f docker-compose.yaml up -d
  docker ps -a
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi
  
  sleep 1
  echo "Sleeping 15s to allow etcdraft cluster to complete booting"
  sleep 14
  
  docker exec cli scripts/script.sh
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Test failed"
    exit 1
  fi
}

MODE=$1
shift
if [[ "$MODE" != "up" ]] && [[ "$MODE" != "down" ]]; then
  printHelp
  exit 1
fi

askProceed

if [ "${MODE}" == "up" ]; then
  networkUp
elif [ "${MODE}" == "down" ]; then
  networkDown
else
  printHelp
  exit 1
fi