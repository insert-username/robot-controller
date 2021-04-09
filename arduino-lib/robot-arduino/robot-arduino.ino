#include <Wire.h>

#define I2C_ADDR 8

#define STEP_L 9
#define DIR_L 8
#define STEP_R 7
#define DIR_R 6

const uint8_t CMD_FWD =          0b00000001;
const uint8_t CMD_REV =          0b00000010;
const uint8_t CMD_YAW_LEFT =     0b00000011;
const uint8_t CMD_YAW_RIGHT =    0b00000100;
const uint8_t CMD_BANK_LEFT =    0b00000101;
const uint8_t CMD_BANK_RIGHT =   0b00000110;
const uint8_t CMD_PARK =         0b00000111;


uint8_t commandByte = CMD_PARK;

const int stepIntervalMicros = 1000;

void setup() {
  Wire.begin(I2C_ADDR);
  Wire.onReceive(i2cReceive);
  
  pinMode(DIR_L, OUTPUT);
  pinMode(DIR_R, OUTPUT);
  pinMode(STEP_L, OUTPUT);
  pinMode(STEP_R, OUTPUT);

  //Serial.begin(9600);
}

void i2cReceive(int byteCount) {
  uint8_t input;

  // just read everything for now. not worrying about error states.
  while(Wire.available() > 0) {
    input = Wire.read();
  }

  commandByte = input;
}

void stepBoth(int intervalMicros, int steps) {
  for (int i = 0; i < steps; i++) {
    digitalWrite(STEP_L, HIGH);
    digitalWrite(STEP_R, HIGH);
    delayMicroseconds(intervalMicros);
    digitalWrite(STEP_L, LOW);
    digitalWrite(STEP_R, LOW);
    delayMicroseconds(intervalMicros);
  }
}


void loop() {

  int motorLDir = 1;
  int motorRDir = 1;
  bool shouldStepL = true;
  bool shouldStepR = true;
  switch(commandByte) {
    case CMD_FWD:
      motorLDir = 1;
      motorRDir = 1;
      break;
    case CMD_REV:
      motorLDir = 0;
      motorRDir = 0;
      break;
    case CMD_YAW_LEFT:
      motorLDir = 0;
      motorRDir = 1;
      break;
    case CMD_BANK_LEFT:
      motorLDir = 0;
      shouldStepR = false;
      break;
    case CMD_YAW_RIGHT:
      motorLDir = 1;
      motorRDir = 0;
      break;
    case CMD_BANK_RIGHT:
      motorRDir = 0;
      shouldStepL = false;
      break;
    default:
      // default case includes CMD_PARK
      shouldStepL = false;
      shouldStepR = false;
  }

  /*
  Serial.print(motorLDir);
  Serial.print(" ");
  Serial.print(motorRDir);
  Serial.print(" ");
  Serial.print(shouldStepL);
  Serial.print(" ");
  Serial.println(shouldStepR);
  */

  digitalWrite(DIR_L, motorLDir == 1 ? 0 : 1);
  digitalWrite(DIR_R, motorRDir);

  for (int i = 0; i < 5; i++) {
    digitalWrite(STEP_L, shouldStepL);
    digitalWrite(STEP_R, shouldStepR);
    delayMicroseconds(stepIntervalMicros);
    digitalWrite(STEP_L, LOW);
    digitalWrite(STEP_R, LOW);
    delayMicroseconds(stepIntervalMicros);
  }
}
