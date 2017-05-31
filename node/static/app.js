"use strict";

// open a connection to the serial server:
const socket = io.connect('http://localhost:8080');

// Might not use these.
const kt = document.getElementById("kt");
const cl = document.getElementById("cl");

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
  return siteID;
}

// Start up new site with fresh data.
function createSite(siteID, siteName, data) {
  if ( document.getElementById('waiting') ) {
    // Remove waiting text if it's still around.
    var waiting = document.getElementById('waiting');
    waiting.parentNode.removeChild(waiting);
  }

  var nameEL = document.createElement('h2');
  nameEL.classList.add('data', 'data–name');
  nameEL.innerHTML = siteName;

  var idEL = document.createElement('div');
  idEL.classList.add('data', 'data–id');
  idEL.innerHTML = "id: " + data.id + "<br>";

  var paramEL = document.createElement('div');
  paramEL.classList.add('data', 'data–params');
  paramEL.innerHTML = "params: " + data.params;

  var container = document.createElement('div');
  container.setAttribute('id', siteID);
  container.classList.add('half', siteID);
  container.appendChild(nameEL).appendChild(idEL).appendChild(paramEL);

  document.body.appendChild(container);
}

function refreshSite(siteID) {
  if ( document.getElementById(siteID) ) {
    console.log('Site exists. Commencing teardown.');

    var oldSiteData = document.getElementById(siteID);
    oldSiteData.parentNode.removeChild(oldSiteData);
  }
}

// Improved refresh that doesn't tear down DOM, just replaces values where needed.
function refreshSite2(siteID, data) {
  if ( siteExists(siteID) ) {
    console.log('Site exists. Commencing refresh.');

    document.querySelector('#' + siteID + '.data–id').innerHTML = "id: " + data.id;
    document.querySelector('#' + siteID + '.data–params').innerHTML = "params: " + data.params;
  }
}

function siteExists(siteID) {
  if ( document.getElementById(siteID) ) {
    return true;
  } else {
    return false;
  }
}

function dataValid(data) {
  if (typeof data == 'object') {
    return true;
  } else {
    return false;
  }
}

 // when you get a serialdata event, do this:
socket.on('serialEvent', function (data) {
  console.log(data);

  if ( dataValid(data) ) {
      console.log('valid data object r3c13v3d.');

      var siteName = getName(data);
      var siteID = processSiteName(siteName);

      if ( siteExists(siteID) ) {
        refreshSite2(siteID, data);
      } else {
        createSite(siteID, siteName, data);
      }
  }
});

// Send event to server with data object.
function requestMission() {
  var code = this.getAttribute('data-code');
  var rover = this.getAttribute('data-site');
  var reqMsg = {code: code, rover: rover};

  console.log(reqMsg);
  socket.emit('missionRequest', reqMsg);
}

// Handle buttons.
// var el = document.querySelector('button');
// el.addEventListener("click", requestMission, false);

// for each iterates over a list and runs a function for each element
// var forEach = Array.prototype.forEach;

// for each element in the list returned by the CSS selector
Array.prototype.forEach.call(
  document.querySelectorAll.bind(document)('button'),
  function(el) {
    // add an event listener to the click event
    el.addEventListener("click", requestMission, false);
  }
);
