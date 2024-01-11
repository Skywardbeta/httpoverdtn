#!/bin/sh

BP_SOURCE=ipn:1.1
BP_DESTINATION=ipn:1.2
BP_SERVICE=0.1
BP_REQUEST=request.txt
BP_RESPONSE=testfile1

. delay.sh
echo "bpsendfile ${BP_SOURCE} ${BP_DESTINATION} ${BP_REQUEST} ${BP_SERVICE}"
echo "bprecvfile ${BP_SOURCE} 1"
echo -n "" >"${BP_RESPONSE}"
echo "---$((REQUEST_NUMBER=REQUEST_NUMBER+1))---"
cat "${BP_REQUEST}" | sed -u 's/^/> /'
echo "[ SEND ]"
delay ">"
bpsendfile "${BP_SOURCE}" "${BP_DESTINATION}" "${BP_REQUEST}" "${BP_SERVICE}"
echo "[ RECEIVE ]"
delay "<"
bprecvfile "${BP_SOURCE}" 1
cat "${BP_RESPONSE}" | sed -u 's/^/< /'