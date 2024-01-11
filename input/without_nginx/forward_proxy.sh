#!/bin/sh

BP_SOURCE=ipn:1.2
BP_DESTINATION=ipn:1.1
BP_SERVICE=0.1
NC_HOST=127.0.0.1
NC_PORT=4000

BP_REQUEST=testfile1
NC_REQUEST=request.pipe
NC_RESPONSE=response.pipe
BP_RESPONSE=response

EOT=$(printf "\4\4\4\4\4\4\4\4")

. delay.sh
TMP_DIR=$(mktemp -d /tmp/$(basename $0).XXXXXX) || exit 1
trap 'rm -rf "${TMP_DIR}"; exit' INT TERM QUIT EXIT
cd "${TMP_DIR}"
touch "${BP_RESPONSE}" "${BP_REQUEST}" "${NC_RESPONSE}" "${NC_REQUEST}"
#mkfifo -m 600 "${NC_RESPONSE}" "${NC_REQUEST}"

echo "Path: $(pwd)"
echo "Request In:   bprecvfile ${BP_SOURCE} 1"
echo "Server I/O:   nc -N ${NC_HOST} ${NC_PORT}"
echo "Response Out: bpsendfile ${BP_SOURCE} ${BP_DESTINATION} ${BP_RESPONSE} ${BP_SERVICE}"

while true
do
  echo "---$((REQUEST_NUMBER=REQUEST_NUMBER+1))---"
  echo "[ RECEIVE FILE : ${BP_REQUEST} ]"
  delay "<"
  bprecvfile "${BP_SOURCE}" 1
  cat "${BP_REQUEST}" |
  sed -u "s/^Host:.*/Host: ${NC_HOST}:${NC_PORT}/I" | # HTML Request Patch
  sed -u "s/^Connection:.*/Connection: close/I" | # HTML Request Patch
  tee "${NC_REQUEST}" | sed 's/^/< /'
  cat "${NC_REQUEST}" |
  nc -N "${NC_HOST}" "${NC_PORT}" >"${NC_RESPONSE}"
  cat "${NC_RESPONSE}" |
  tee "${BP_RESPONSE}" | sed 's/^/> /'
  echo "[ SEND FILE : ${BP_RESPONSE} ]"
  delay ">"
  bpsendfile "${BP_SOURCE}" "${BP_DESTINATION}" "${BP_RESPONSE}" "${BP_SERVICE}"
done