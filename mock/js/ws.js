// WebSocket events
function onOpen(evt) {
    // Send ID
    send("uid: " + uid);
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
function send(message) {
	websocket.send(message);
}

function close() {
	websocket.close();
}

// Instantiate WebSocket object
var wsUri = "ws://localhost:8080";
var websocket = new WebSocket(wsUri);

websocket.onopen = function(evt) { onOpen(evt) };
websocket.onclose = function(evt) { onClose(evt) };
websocket.onmessage = function(evt) { onMessage(evt) };
websocket.onerror = function(evt) { onError(evt) };
