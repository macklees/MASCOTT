// xBeeSendReceiveMsg
// demo to send and receive data from the xBee

// sending a message is, for this example, simply triggered by pressing a button.
// the program also receives any incoming messages and provesses them.
// a message is any sequence of characters, terminated by a newLine character.

// this demo shows how to parse a message into independent fields and convert
// them to integers, if the field represents a numeric value. the input message is
// assumed to have fields that are delimnited by TAB characters.

#include <SoftwareSerial.h>
#include <Button.h>

const String myNodeName = "Red Rover";
// const String myNodeName = "New World";

const int ledPin = 13;
const int beepPin = 12;

const byte TAB_CHAR = 0x09;
const byte NEWLINE_CHAR = 0x0A;

// information for extracting the fields from the larger message

// maximum number of fields to extract from a single message
// can be made larger -- only limited by memory available
const int MAX_FIELDS = 4;

// initialize the serial port for the xBee with whatever pins are used for it
SoftwareSerial xBee(2, 3); // (TX, RX) : pins on XBee adapter

// declare a button to be used for input, without a pulldown resistor on the board
Button butt(7, INPUT_PULLUP);

int butter = 0;     // counts the number of times the button has been clicked
int messages = 0;   // counts the number of messages that have been received


void setup()  {

  // initialize our own serial monitor window
  Serial.begin(9600);
  Serial.println("\n\nxBeeSendReceiveMsg");

  // set pin modes
  pinMode(ledPin, OUTPUT);
  pinMode(beepPin, OUTPUT);

  // initialize and set the data rate for the SoftwareSerial port -- to send/receive messages via the xBee
  xBee.begin(9600);

}


void loop() {

  // look for button happenings
  int action = butt.checkButtonAction();

  // count the number of times it is clicked, and
  // send a message on the XBee each time
  if (action == Button::CLICKED) {

    butter++;    // increment the counter

    // format the message to be sent:
    // this example uses a tab to delimit fields and ends it with a newLine termminator
    // you can do whatever you want in your message
    // AS LONG AS YOU END IT WITH THE NEWLINE CHARACTER
    // that is needed for the receiver to detect the end of a message
    String msg = myNodeName + "\t" + butter + "\t" + "message payload here" + "\n";

    // blink the LED, beep the piezo, and send the message (also to our serial monitor window)
    digitalWrite(ledPin, HIGH);
    tone(beepPin, 440, 150);
    Serial.print(msg);
    xBee.print(msg);
    digitalWrite(ledPin, LOW);

  }

  // hold-clicking the button resets the counter to zero
  else if (action == Button::HELD_CLICKED) {
    butter = 0;
    tone(beepPin, 880, 150);
    Serial.println(butter);
  }

  // check to see if any complete incoming messages are ready
  String msg = checkMessageReceived();

  if (msg.length() > 0) {
    // if the result is a null string, then there is not a complete message ready
    // otherwise we have received a complete message and can process it

    {
      // this is just for logging the messages; or for debugging
      messages++;
      digitalWrite(ledPin, HIGH);
      tone(beepPin, 220, 100);
      Serial.print("Msg # ");
      Serial.print(messages);
      Serial.print(": ");
      Serial.println(msg);
      digitalWrite(ledPin, LOW);
    }

    // now that we have the message you just recieved in one big string ("msg"),
    // it is very likely you might want to parse it using String object methods:
    //  https://www.arduino.cc/en/Reference/StringObject

    // Below is some code that will split out the tab-delimited fields in that big string
    // into an array of strings ("msgFields[]"), each entry representing a different field
    // (in the order they were received)

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
    for (int i = 0; i < msg.length(); i++) {
      if (((msg.charAt(i) == TAB_CHAR) ||
           (msg.charAt(i) == NEWLINE_CHAR)) &&
          (fieldsFound < MAX_FIELDS)) {
        msgFields[fieldsFound] = buf;
        buf = "";
        fieldsFound++;
      }
      else {
        buf += msg.charAt(i);
      }
    }

    // now we should have filled the array of Strings 'msgFields' with 'fieldsFound' entries
    Serial.print("found fields = ");
    Serial.println(fieldsFound);
    for (int i = 0; i < fieldsFound; i++) {
      Serial.println(msgFields[i]);
    }

    // finally, these fields are all strings, so what if you know that the second field, e.g., is a string
    // that really represents a number and you want to use it as an integer? here's what you do:
    // -- remember that the index of field #2 is really [1].
    int aNumber = msgFields[1].toInt();
    Serial.print("my second field contained the number = ");
    Serial.println(aNumber);

    // and then you could do something like this, if that 2nd field is your message type code:
    switch (aNumber) {
      case 1:
        // message code = 1 action
        Serial.println("code 1");
        break;
      case 2:
        // message code = 2 action
        Serial.println("code 2");
        break;
      default:
        // if nothing else matches, do the default
        Serial.println("code unknown");
        break;
    }

  }

}


// checks to see if a complete message (one terminated by a newLine) has been received
// if it has, the message will be returned to the caller (without the newLine)
// if not, it will keep accumulating characters from the xBee and just return a null string.

String checkMessageReceived () {

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
