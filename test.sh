#!/usr/bin/env bash

# enable job control
set -m

node . &
firefox client.html

fg 1

