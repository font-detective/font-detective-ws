// WebSocket globals
var wsUri = "ws://nugenthill.com:8080";
var websocket = false;

// WebSocket events
function onOpen(evt) {
    // Send ID
    sendWS("uid: " + uid);
}

function onClose(evt) {
	console.log("WebSocket connection closed");
}

function onMessage(evt) {
	console.log("Received: " + evt.data);
}

function onError(evt) {
	console.error(evt);
}

// WebSocket function wrappers
function sendWS(message) {
	websocket.send(message);
}

function closeWS() {
	websocket.close();
}

function initWS() {
	// Instantiate WebSocket object
	websocket = new WebSocket(wsUri);

	websocket.onopen = function(evt) { onOpen(evt) };
	websocket.onclose = function(evt) { onClose(evt) };
	websocket.onmessage = function(evt) { onMessage(evt) };
	websocket.onerror = function(evt) { onError(evt) };

	return websocket;
}
