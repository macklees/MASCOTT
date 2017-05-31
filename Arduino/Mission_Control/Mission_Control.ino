/*  Anew Mission Control
 *
 *  XBee Message parsing code courtesy of Brock Craft and Andy Davidson.
 *  JSON String conversion adapted from Tom Igoe: http://www.tigoe.com/pcomp/code/arduinowiring/1109/
 *  setColor() function by Adafruit.
 *  heartbeat() function by Paul Badger: http://playground.arduino.cc/Main/HeartbeatSketch#sourceblock2
 */

#include <SoftwareSerial.h>
#include <Button.h>

const String siteName = "Anew";

const int ledPin = 13;
const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;
#define COMMON_ANODE

const int beepPin = 5;
const int buttonPin = 4;
Button button(buttonPin, INPUT_PULLUP);

const byte TAB_CHAR = 0x09;
const byte NEWLINE_CHAR = 0x0A;

// information for extracting the fields from the larger message

// maximum number of fields to extract from a single message
// can be made larger—only limited by memory available
const int MAX_FIELDS = 4;

// initialize the serial port for the xBee with whatever pins are used for it
SoftwareSerial xBee(2, 3); // (TX, RX) : pins on XBee adapter

int butter = 0;     // counts the number of times the button has been clicked
int messages = 0;   // counts the number of messages that have been received


void setup()  {

  // initialize our own serial monitor window
  Serial.begin(9600);
  // initialize and set the data rate for the SoftwareSerial port -- to send/receive messages via the xBee
  xBee.begin(9600);

  // set pin modes
  pinMode(ledPin, OUTPUT);
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
  pinMode(beepPin, OUTPUT);
}


void loop() {

  // heartbeat timing
  heartBeat(3.0);

  int action = button.checkButtonAction();

  if (action == Button::CLICKED) {

    String outMsg = siteName + "\t" + "14" + "\t" + "Red Rover" + "\n";
    setColor(0, 255, 0); // aqua
    tone(beepPin, 440, 150);
    xBee.print(outMsg);
//    Serial.println(msg);
  } else if (action == Button::HELD_CLICKED) {
    String outMsg = siteName + "\t" + "42" + "\t" + "Red Rover" + "\n";
    setColor(255, 60, 0); // aqua
    tone(beepPin, 220, 250);
    xBee.print(outMsg);
  }

  // Check to see if any complete incoming messages are ready
  String inMsg = checkMessageReceived();

  if (inMsg.length() > 0) {
    // If the result is a null string, then there is not a complete message ready
    // otherwise we have received a complete message and can process it.

    // The following splits out tab-delimited fields in inMsg string
    // into an array of strings ("msgFields[]"), each entry representing a different field
    // (in the order they were received).

    String msgFields[MAX_FIELDS];

    // intialize them all to null strings each time we start processing a new message
    for (int i = 0; i < MAX_FIELDS; i++) {
      msgFields[i] = "";
    }

    // initialize temporary variables used to process each message
    int fieldsFound = 0;
    String buf = "";

    // now, loop through the big single string, character by character, looking for the
    // field delimiter (a TAB, or a NEWLINE if it is the last field). accumulate non-delimiters
    // in a small buffer, and then use that to transfer to the array of fields.
    // once we find a delimiter, we know we've just finished getting a field, so
    // store it in the next available element of the array that is accumulating the
    // individual fields, and reset the field buffer. also increment the counter tracking
    // how many fields we found. if there are more fields in the source string than we have room for,
    // toss any extra ones out so we don't overrun the array limits and cause nasty bugs!
    for (int i = 0; i < inMsg.length(); i++) {
      if (((inMsg.charAt(i) == TAB_CHAR) ||
           (inMsg.charAt(i) == NEWLINE_CHAR)) &&
          (fieldsFound < MAX_FIELDS)) {
        msgFields[fieldsFound] = buf;
        buf = "";
        fieldsFound++;
      }
      else {
        buf += inMsg.charAt(i);
      }
    }

    // now we should have filled the array of Strings 'msgFields' with 'fieldsFound' entries
    // Serial.print("found fields = ");
    // Serial.println(fieldsFound);
    // for (int i = 0; i < fieldsFound; i++) {
    //   Serial.println(msgFields[i]);
    // }

    // read for incoming messages. c = send data over serial, x = don't send:
    char inChar = Serial.read();
    bool sending;
    switch (inChar) {
      case 'c':    // connection open
        sending = true;
        break;
      case 'x':    // connection closed
        sending = false;
        break;
    }
    sending = true;

    if (sending) {
      String jsonString = formJSON(msgFields);
      Serial.println(jsonString);
    }

    // finally, these fields are all strings, so what if you know that the second field, e.g., is a string
    // that really represents a number and you want to use it as an integer? here's what you do:
    // -- remember that the index of field #2 is really [1].
    int aNumber = msgFields[1].toInt();
    //Serial.print("Field 2: ");
    //Serial.println(aNumber);

    // Special handling for certain codes
    // switch (aNumber) {
    //   case 1:
    //     // message code = 1 action
    //     Serial.println("code 1");
    //     break;
    //   case 2:
    //     // message code = 2 action
    //     Serial.println("code 2");
    //     setColor(255, 0, 0); // aqua
    //     break;
    //   default:
    //     // if nothing else matches, do the default
    //     Serial.println("code unknown");
    //     Serial.println(inMsg);
    //     break;
    // }
  }

  // Check to see if any complete outgoing messages are ready to send.
  String newMission = checkSerialInput();

  if (newMission.length() > 0) {
    // Like inMsg code above, this handles recieved Serial input and the requisite output.

    String msgFields[2];

    // intialize them all to null strings each time we start processing a new message
    for (int i = 0; i < 2; i++) {
      msgFields[i] = "";
    }

    // initialize temporary variables used to process each message
    int fieldsFound = 0;
    String buf = "";

    // now, loop through the big single string, character by character, looking for the
    // field delimiter (a comma, or a NEWLINE if it is the last field). accumulate non-delimiters
    // in a small buffer, and then use that to transfer to the array of fields.
    // once we find a delimiter, we know we've just finished getting a field, so
    // store it in the next available element of the array that is accumulating the
    // individual fields, and reset the field buffer. also increment the counter tracking
    // how many fields we found. if there are more fields in the source string than we have room for,
    // toss any extra ones out so we don't overrun the array limits and cause nasty bugs!
    for (int i = 0; i < newMission.length(); i++) {
      if (
        ((newMission.charAt(i) == ',') ||
        (newMission.charAt(i) == NEWLINE_CHAR)) &&
        (fieldsFound < 2)
      ) {
        msgFields[fieldsFound] = buf;
        buf = "";
        fieldsFound++;
      }
      else {
        buf += newMission.charAt(i);
      }
    }

    startNewMission(msgFields[1].toInt(), msgFields[2]);
  }
} // End loop().

// Send a new mission code out over the xBee, provided a misison code and reciepient rover name.
void startNewMission(int missionCode, String roverName) {
  String outMsg = siteName + "\t" + String(missionCode) + "\t" + roverName + "\n";
  setColor(0, 255, 80); // seafoam green
  tone(beepPin, 440, 450);
//  Serial.print("Sent new mission, ");
//  Serial.print(missionCode);
//  Serial.print(", to ");
//  Serial.println(roverName);
  xBee.print(outMsg);
}

// Checks for new inout over the serial port and returns a string of data, ended by a newline character.
String checkSerialInput() {
  static String inputBuffer = "";
  String returnInput = "";

  while (Serial.available() > 0) {
      char received = Serial.read();
      inputBuffer.concat(received);

      // Process message when new line character is received.
      if (received == '\n') {
          returnInput = inputBuffer;
          inputBuffer = "";
      }
  }

  return returnInput;
}

// Checks to see if a complete message (one terminated by a newLine) has been received.
// If it has, the message will be returned to the caller (without the newLine).
// If not, it will keep accumulating characters from the xBee and just return a null string.
String checkMessageReceived() {

  static String msgBuffer = ""; // buffer to collect incoming message: static instead of global !
  String returnMsg = "";        // the result to return to the caller

  if (xBee.available()) {

    // there is at least one character in the input queue of the XBee,
    // so fetch it. to prevent blocking the main loop, only one byte
    // is fetched on each call. add it to the nsg buffer accumulating the byutes
    byte ch = xBee.read();
    msgBuffer += char(ch);

    // now check to see if this is the message terminator
    if (ch == NEWLINE_CHAR) {
      // if so, then return the completed message
      returnMsg = msgBuffer;
      // and clear out the buffer for the next message
      msgBuffer = "";
    }
    else {
      // the message isn't complete yet, so just return a null string to the caller
    }
  }

  else {
    // nothing has been received, so
    // return a null string to the caller
  }

  return returnMsg;
}

// Simpler Anode RGB LED control.
void setColor(int red, int green, int blue) {
  #ifdef COMMON_ANODE
    red = 255 - red;
    green = 255 - green;
    blue = 255 - blue;
  #endif
  analogWrite(redPin, red);
  analogWrite(greenPin, green);
  analogWrite(bluePin, blue);
}

// Forms a JSON-formatted string from msgFields.
String formJSON(String* msgFields) {

  String jsonString = "{\"name\":\"";
  jsonString += msgFields[0];
  jsonString += "\",\"id\":\"";
  jsonString += msgFields[1];

  // Iff params field exists, add its contents to JSON.
  if (msgFields[2] != false) {
    jsonString += "\",\"params\":\"";
    jsonString += msgFields[2];
  }

  jsonString += "\"}";

  return jsonString;
}

// Pacemaker for regulating heartbeat.
void heartBeat(float tempo){
  static int hbeatIndex = 1;    // this initialization is not important
  static long heartBeatArray[] = { 50, 100, 15, 1200 };
  static long prevMillis;

  if ((millis() - prevMillis) > (long)(heartBeatArray[hbeatIndex] * tempo)){
    hbeatIndex++;
    if (hbeatIndex > 3) hbeatIndex = 0;

    if ((hbeatIndex % 2) == 0){     // modulo 2 operator will be true on even counts
        setColor(0, 255, 255); // aqua
    } else {
        setColor(0, 0, 0); // off
    }
    prevMillis = millis();
  }
}
