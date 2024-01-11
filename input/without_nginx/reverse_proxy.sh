#!/bin/sh

BP_SOURCE=ipn:1.1
BP_DESTINATION=ipn:1.2
BP_SERVICE=0.1
NC_HOST=0.0.0.0
NC_PORT=8080

#NC_REQUEST=request.pipe
BP_REQUEST=request
BP_RESPONSE=testfile1
NC_RESPONSE=response.pipe

EOT=$(printf "\4\4\4\4\4\4\4\4")

. delay.sh
TMP_DIR=$(mktemp -d /tmp/$(basename $0).XXXXXX) || exit 1
trap 'rm -rf "${TMP_DIR}"; exit' INT TERM QUIT EXIT
cd "${TMP_DIR}"
touch "${BP_RESPONSE}" "${BP_REQUEST}"
mkfifo -m 600 "${NC_RESPONSE}" #"${NC_REQUEST}"

echo "Path: $(pwd)"
echo "Client I/O: nc -N -l ${NC_HOST} ${NC_PORT}"
echo "Proxy Out:  bpsendfile ${BP_SOURCE} ${BP_DESTINATION} ${BP_REQUEST} ${BP_SERVICE}"
echo "Proxy In:   bprecvfile ${BP_SOURCE} 1"

while true
do
  echo "---$((REQUEST_NUMBER=REQUEST_NUMBER+1))---"
  cat "${NC_RESPONSE}" | nc -N -l "${NC_HOST}" "${NC_PORT}" |
  (
    echo -n "" >"${BP_REQUEST}"
    while read LINE
    do
      echo "${LINE}" >>"${BP_REQUEST}"
      LINE=$(echo "${LINE}" | tr -d '[\r\n]')
      if [ "x${LINE}" = "x" ]
      then
        cat "${BP_REQUEST}" | sed -u 's/^/> /';
        echo "[ SEND FILE : ${BP_REQUEST} ]"
        delay ">"
        bpsendfile "${BP_SOURCE}" "${BP_DESTINATION}" "${BP_REQUEST}" "${BP_SERVICE}"
        echo "[ RECEIVE FILE : ${BP_RESPONSE} ]"
        delay "<"
        bprecvfile "${BP_SOURCE}" 1
        cat "${BP_RESPONSE}" | tee "${NC_RESPONSE}" | sed -u 's/^/< /'
        break
      fi
    done
  )
done