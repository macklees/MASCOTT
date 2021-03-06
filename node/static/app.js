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
  var siteID;
  if ( siteName == 'Red Rover' ) {
    console.log('Red rover message recieved.');
    siteID = 'kt';
  } else if ( siteName == 'New World' ) {
    console.log('New World message recieved.');
    siteID = 'cl';
  }
  return siteID;
}

function missionIDToName(missionID) {
  missionID = parseInt(missionID); // Typecast string as int.
  var missionName;
  switch (missionID) {
    case 9:
      missionName = 'Direction';
      break;
    case 11:
      missionName = 'Temperature';
      break;
    case 12:
      missionName = 'Humidity';
      break;
    case 14:
      missionName = 'Unobtainium';
      break;
    case 42:
      missionName = 'Life';
      break;
    default:
      missionName = 'Unknown Mission';
    }
  return missionName;
}

function processParamOutput(missionID, param) {
  missionID = parseInt(missionID); // Typecast string as int.
  var paramOutput;
  switch (missionID) {
    case 9:
      paramOutput = 'Moving ' + param;
      break;
    case 11:
      paramOutput = 'Currently ' + param + 'ºC';
      break;
    case 12:
      paramOutput = param + '%';
      break;
    case 14:
      if (param == 'true') {
        paramOutput = 'Detected';
      } else {
        paramOutput = 'None detected';
      }
      break;
    case 42:
    if (param == 'true') {
      paramOutput = 'Detected';
    } else {
      paramOutput = 'None detected';
    }
      break;
    default:
      paramOutput = '';
    }
  return paramOutput;
}

// Start up new site with fresh data.
function createSite(siteID, siteName, data) {
  console.log('Creating new site.');

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
  idEL.innerHTML = missionIDToName(data.id);

  var paramEL = document.createElement('div');
  paramEL.classList.add('data', 'data–params');
  paramEL.innerHTML = processParamOutput(data.id, data.params);

  var timeEL = document.createElement('div');
  timeEL.classList.add('data', 'data–time');
  timeEL.innerHTML = Date.now();

  var container = document.createElement('div');
  container.setAttribute('id', siteID);
  container.classList.add('half', siteID);
  container.appendChild(nameEL);
  container.appendChild(idEL)
  container.appendChild(paramEL);
  container.appendChild(timeEL);

  document.getElementById('content').appendChild(container);
}

function refreshSite(siteID, siteName, data) {
  console.log('Site exists. Commencing teardown.');

  var oldSiteData = document.getElementById(siteID);
  oldSiteData.parentNode.removeChild(oldSiteData);

  createSite(siteID, siteName, data);
}

// Improved refresh that doesn't tear down DOM, just replaces values where needed.
function refreshSite2(siteID, data) {
  console.log('Site exists. Commencing refresh.');
  var codeEl = document.body.querySelector('#' + siteID + ' .data–id');
  codeEl.innerHTML = missionIDToName(data.id);

  var paramEl = document.body.querySelector('#' + siteID + ' .data–params');
  paramEl.innerHTML = processParamOutput(data.id, data.params);

  var timeEl = document.body.querySelector('#' + siteID + ' .data–time');
  timeEl.innerHTML = Date.now();
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
        // refreshSite(siteID, siteName, data);
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
Array.prototype.forEach.call(
  document.querySelectorAll.bind(document)('button'),
  function(el) {
    // add an event listener to the click event
    el.addEventListener("click", requestMission, false);
  }
);
