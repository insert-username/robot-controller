#!/usr/bin/env bash

# enable job control
set -m

npm start &
firefox client.html

fg 1

