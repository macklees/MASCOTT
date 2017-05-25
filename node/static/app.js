// open a connection to the serial server:
var socket = io.connect('http://localhost:8080');

 // when you get a serialdata event, do this:
socket.on('serialEvent', function (data) {

  // Remove waiting text.
  var waiting = document.getElementById("waiting");
  waiting.parentNode.removeChild(waiting);

  var nameEL = document.createElement('div').setAttribute('id', 'nameEL');
  nameEL.classList.add('data');
  nameEL.innerHTML = "name: " + data.name + "<br>";

  var idEL = document.createElement('div').setAttribute('id', 'idEL');
  idEL.classList.add('data');
  idEL.innerHTML = "id: " + data.id + "<br>";

  var paramEL = document.createElement('div').setAttribute('id', 'paramEL');
  paramEL.classList.add('data');
  paramEL.innerHTML = "params: " + data.params;

  var container = document.createElement('div').setAttribute('id', 'container');
  container.appendChild(nameEL).appendChild(idEL).appendChild(paramEL);

});
