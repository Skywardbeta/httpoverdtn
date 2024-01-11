#!/bin/sh

HOST=0.0.0.0
PORT=4000

REQUEST=request
RESPONSE=response.pipe

TMP_DIR=$(mktemp -d /tmp/$(basename $0).XXXXXX) || exit 1
trap 'rm -rf "${TMP_DIR}"; exit' INT TERM QUIT EXIT
cd "${TMP_DIR}"
touch "${REQUEST}"
mkfifo -m 600 "${RESPONSE}"

echo "Path:   $(pwd)"
echo "Server: nc -N -l ${HOST} ${PORT}"

response()
{
CONTENT_TYPE=application/json
BODY=$(cat <<EOF
{
  "Date": "$(date)"
}
EOF
)
DOCUMENT=$(cat <<EOF
HTTP/1.0 200 OK
Content-Type: ${CONTENT_TYPE}
Content-Length: $((${#BODY}+1))
Connection: close

${BODY}
EOF
)
echo "${DOCUMENT}"
}

while true
do
  echo "---$((REQUEST_NUMBER=REQUEST_NUMBER+1))---"
  cat "${RESPONSE}" | nc -N -l "${HOST}" "${PORT}" |
  (
    echo -n "" >"${REQUEST}"
    while read LINE
    do
      echo "${LINE}" >>"${REQUEST}"
      LINE=$(echo "${LINE}" | tr -d '[\r\n]')
      if [ "x${LINE}" = "x" ]
      then
        cat "${REQUEST}" | sed -u 's/^/< /';
        response | tee "${RESPONSE}" | sed -u 's/^/> /';
        break
      fi
    done
  )
done