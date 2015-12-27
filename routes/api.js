/*
 * Serve JSON to our AngularJS client
 */

var fs = require('fs');
var AWS = require('aws-sdk');

/**
 * WebSockets
 */

var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 8080});

wss.on('connection', function(ws) {
  // Extend object to include WSIDs
  ws.wsids = [];

  ws.on('message', function(message) {
    // WSID message
    var wsid = /^wsid: (.+)$/;
    var result = message.match(wsid);
    ws.wsids.push(result[1]);
  });

  ws.on('close', function(message) {
    console.log("WebSocket: connection terminated");
  });
});

wss.on('error', function close(error) {
  console.error('WebSocket error: %s', error);
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(ws) {
    ws.send(data);
  });
};

wss.findClient = function findClient(wsid) {
  var _ws = false;
  wss.clients.some(function outer(ws) {
    ws.wsids.some(function inner(_wsid) {
      if (_wsid === wsid) {
        return (_ws = ws);
      }
    });
    return _ws;
  });
  return _ws;
};

/**
 * AWS S3
 */

// Set location to Ireland
AWS.config.region = "eu-west-1";

var s3 = new AWS.S3();
var defaultBucket = "fontdetective";
var defaultFolder = "img";

// Puts a file in specified (bucket, key)
function putFileS3(filename, folder, key, bucket, callback) {
  var body = fs.createReadStream(filename);
  putS3(body, folder, key, bucket, callback);
}

// Puts data in specified (bucket, key)
// For now, this is public readable.
function putS3(body, folder, key, bucket, callback) {
  var metadata = { uploaded: Date.now().toString() };
  var fqkey = (folder != "") ? folder + "/" + key : key;
  var s3obj = new AWS.S3({params: {Bucket: bucket, Key: fqkey, Metadata: metadata, ACL:'public-read'}});
  s3obj.upload({Body: body}).
    on("httpUploadProgress", function(evt){
        console.log((evt.loaded / evt.total).toFixed(2) + "%");
    }).
    send(callback);
}

// Gets a file in specified (bucket, key)
function getFileS3(filename, folder, key, bucket, callback) {
  var params = {Bucket: bucket, Key: fqkey};
  var file = require('fs').createWriteStream(filename);
  s3.getObject(params).createReadStream().on("finish", callback).pipe(file);
}

// Gets data from specified (bucket, key)
// returns a callback with err, data
function getS3(callback, folder, key, bucket, callback) {
  var fqkey = (folder != "") ? folder + "/" + key : key;
  var params = {Bucket: bucket, Key: fqkey};
  s3.getObject(params, callback).send();
}

// Gets the link at which the resource may be accessed
function getLink(folder, key, bucket) {
  var fqkey = (folder != "") ? folder + "/" + key : key;
  return "https://s3-" + AWS.config.region + ".amazonaws.com/" + bucket.toString() + "/" + fqkey.toString();
}

/**
 * API
 */

// Uploads a file, first to the server, then to S3.
// Delete the local copy when complete
exports.upload = function (req, res) {
  var fstream;
  var wsid = req.params.wsid;

  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    var path = __dirname + '/../files/' + filename;
    fstream = fs.createWriteStream(path);
    file.pipe(fstream);
    fstream.on('close', function () {
      putFileS3(path, defaultFolder, filename, defaultBucket, function(){
        // Send a message back via WS
        var ws = wss.findClient(wsid);
        if (ws) {
          ws.send("url: " + getLink(defaultFolder, filename, defaultBucket));
        } else {
          console.error("Could not find websocket with WSID. They must have disconnected.");
        }
        res.redirect('back');
        fs.unlink(path);
      });
    });
  });
}