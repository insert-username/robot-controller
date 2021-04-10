#!/usr/bin/env python3

import argparse
import asyncio
import websockets
import json
from smbus import SMBus

WASD_UP = 87
WASD_DOWN = 83
WASD_LEFT = 65
WASD_RIGHT = 68

ARROW_UP = 38
ARROW_DOWN = 40
ARROW_LEFT = 37
ARROW_RIGHT = 39

# possible directions
# FWD,
# REV,
# YAW_LEFT,
# YAW_RIGHT
# BANK_LEFT,
# BANK_RIGHT
class CommandController:

    _bits_fwd = '00'
    _bits_rev = '01'
    _bits_break = '10'

    _key_map = {
        WASD_UP: "UP",
        WASD_DOWN: "DOWN",
        WASD_LEFT: "LEFT",
        WASD_RIGHT: "RIGHT"
    }

    _input_state = {
        "UP": False,
        "DOWN": False,
        "LEFT": False,
        "RIGHT": False
    }

    _output_state = {
        'FWD':          '00000001',
        'REV':          '00000010',
        'YAW_LEFT':     '00000011',
        'YAW_RIGHT':    '00000100',
        'BANK_LEFT':    '00000101',
        'BANK_RIGHT':   '00000110',
        'PARK':         '00000111'
    }

    # Up Down Left Right input ordering
    _output_state_map = {
        ( False, False, False, False ): "PARK",

        # why would you even press all of the keys at once...
        ( True, True, True, True ): "PARK",
        ( False, False, True, True ): "PARK",
        ( True, True, False, False ): "PARK",

        ( True, False, False, False ): "FWD",
        ( True, False, True, True ): "FWD",
        ( False, True, False, False ): "REV",
        ( False, True, True, True ): "REV",

        ( True, False, True, False ): "BANK_LEFT",
        ( True, False, False, True ): "BANK_RIGHT",

        ( False, False, True, False ): "YAW_LEFT",
        ( False, False, False, True ): "YAW_RIGHT",
        ( True, True, True, False ): "YAW_LEFT",
        ( True, True, False, True ): "YAW_RIGHT",
        ( False, True, True, False ): "YAW_LEFT",
        ( False, True, False, True ): "YAW_RIGHT"
    }

    def accept_message(self, message):
        message_object = json.loads(message)
        key_code = message_object["keyCode"]
        key_delta = message_object["delta"]

        if not key_code in self._key_map:
            return

        input_state_identifier = self._key_map[key_code]
        self._input_state[input_state_identifier] = True if key_delta == "down" else False

    def get_command_byte(self):
        command_byte_name = self._output_state_map[(
                self._input_state["UP"],
                self._input_state["DOWN"],
                self._input_state["LEFT"],
                self._input_state["RIGHT"]
            )]

        print("STATE: " + command_byte_name)

        command_byte = self._output_state[command_byte_name]

        return int(command_byte, 2)


argument_parser = argparse.ArgumentParser(description='Start forwarding drone commands to i2c bus.')
argument_parser.add_argument('--dry-run', action='store_true', default=False)
argument_parser.add_argument('--server-uri', required=True, help="URI of the forwarding server.")
arguments = argument_parser.parse_args()

i2c_bus = None
if (not arguments.dry_run):
    i2c_arduino_addr = 0x8
    i2c_bus = SMBus(1)
else:
    print("Dry Run: no i2c connection will be made.")

command_controller = CommandController()

print("Starting...")

async def connect():
    print("Attempting to connect to server uri: " + arguments.server_uri)
    async with websockets.connect(arguments.server_uri) as ws:
        print("Connected!")
        async for message in ws:
            print(message)
            command_controller.accept_message(message)
            command_byte = command_controller.get_command_byte()

            print("Command byte: " + str(command_byte))

            if (i2c_bus):
                try:
                    i2c_bus.write_byte(i2c_arduino_addr, command_byte)
                except:
                    print("IO Error, got a loose wire? :p")

asyncio.get_event_loop().run_until_complete(connect())

