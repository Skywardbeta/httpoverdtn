#!/bin/sh

DELAY=15

timer_display ()
{
  DISPLAY_D=$(($1/86400))
  DISPLAY_H=$((($1%86400)/3600))
  DISPLAY_M=$((($1%3600)/60))
  DISPLAY_S=$(($1%60))
  printf "%02dd %02dh %02dm %02ds" $DISPLAY_D $DISPLAY_H $DISPLAY_M $DISPLAY_S
}

delay_display ()
{
  DISPLAY_TIMER=$1
  DISPLAY_TOKEN=$2
  echo -n ' '
  while expr 0 '<' "${DISPLAY_TIMER}" >/dev/null
  do
    DISPLAY_TIMER=$(expr "${DISPLAY_TIMER}" '-' 1)
    sleep 1
    echo -n "${DISPLAY_TOKEN}"
  done
  echo ''
}

delay ()
{
  DELAY_TIMER="${DELAY}"
  DELAY_TOKEN=$1
  DELAY_TOKEN=${DELAY_TOKEN:='.'}
  while expr 0 '<' "${DELAY_TIMER}" >/dev/null
  do
    timer_display "${DELAY_TIMER}"
    if expr 60 '<' "${DELAY_TIMER}" >/dev/null
    then
      DELAY_TIMER=$(expr "${DELAY_TIMER}" '-' 60)
      delay_display 60 "${DELAY_TOKEN}"
    elif expr 10 '<' "${DELAY_TIMER}" >/dev/null
    then
      DELAY_TIMER=$(expr "${DELAY_TIMER}" '-' 10)
      delay_display 10 "${DELAY_TOKEN}"
    else
      DELAY_TIMER=$(expr "${DELAY_TIMER}" '-' 1)
      delay_display 1 "${DELAY_TOKEN}"
    fi
  done
}