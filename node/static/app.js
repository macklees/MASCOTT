// open a connection to the serial server:
var socket = io.connect('http://localhost:8080');

var kt = document.getElementById("kt");
var cl = document.getElementById("cl");

function getName(data) {
  return data.name;
}

function processSiteName(siteName) {
  if ( siteName == 'Red Rover' ) {
    console.log('Red rover message recieved.');
    siteName = 'kt';
  } else if ( siteName == 'New World' ) {
    console.log('New World message recieved.');
    siteName = 'cl';
  }
}

function createSite(siteName, data) {
  var nameEL = document.createElement('h2');
  nameEL.classList.add('data', 'data–name');
  nameEL.innerHTML = "name: " + siteName;

  var idEL = document.createElement('div');
  idEL.classList.add('data', 'data–id');
  idEL.innerHTML = "id: " + data.id + "<br>";

  var paramEL = document.createElement('div');
  paramEL.classList.add('data', 'data–params');
  paramEL.innerHTML = "params: " + data.params;

  var container = document.createElement('div').setAttribute('id', siteName);
  container.classList.add('half', siteName);
  container.appendChild(nameEL).appendChild(idEL).appendChild(paramEL);
}

function refreshSite(siteName) {
  if ( document.getElementById(siteName) ) {
    console.log('Site exists. Commencing teardown.');

    var oldSiteData = document.getElementById(siteName);
    oldSiteData.parentNode.removeChild(oldSiteData);
  }
}

function refreshSite2(siteName, data) {
  if ( siteExists(siteName) ) {
    console.log('Site exists. Commencing refresh.');

    document.querySelectorAll('#' + siteName + '.data–id').innerHTML = "id: " + data.id;
    document.querySelectorAll('#' + siteName + '.data–params').innerHTML = "params: " + data.params;
  }
}

function siteExists(siteName) {
  if ( document.getElementById(siteName) ) {
    return true;
  } else {
    return false;
  }
}

function dataValid(data) {
  if ( data.slice(-1) == '\n' ) {
    return true;
  } else {
    return false;
  }
}

 // when you get a serialdata event, do this:
socket.on('serialEvent', function (data) {

  if ( dataValid(data) ) {
      // Remove waiting text.
      var waiting = document.getElementById("waiting");
      waiting.parentNode.removeChild(waiting);

      var siteName = processSiteName(getName(data));

      if ( siteExists(siteName) ) {
        refreshSite2(siteName, data);
      } else {
        createSite(siteName, data);
      }
  }

});
