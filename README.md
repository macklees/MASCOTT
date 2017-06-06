# Anew Mission Control
This repo contains code for our HCDE 439 team's project, Anew. Briefly, this project uses an Arduino equipped with an xBee module to network with other remote sites. The Arduino sketch sends data in JSON over serial to a node server that validates the data, then sending it to a client webpage over WebSockets (using the Sockets.io library). The client can then route commands to the Aruino to be sent over xBee going. 

More informatin on the project as a whole can be found at the project site, [Anew Space Agency](https://anewspaceagency.squarespace.com#anew-miss-section).
