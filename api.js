  /*
 * Serve JSON to our AngularJS client
 */

var fs = require('fs');
var AWS = require('aws-sdk');

// Set location to Ireland
AWS.config.region = "eu-west-1";

/**
 * WebSockets
 */

var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 8080});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    // UID message
    var uid = /^uid: (.+)$/;
    var result = message.match(uid);
    if (result) {
      if (!ws.uids) {
        ws.uids = [];
      }
      ws.uids.push(result[1]);
    }

    // BB message
    var bb = /^bb: (.+)$/;
    result = message.match(bb);
    if (result) {
      // Add to SimpleDB
      // TODO

      // Add new request to SQS
      var request = JSON.parse(result[1]);
      console.log(request);

      // Check UID/URL match those received in request
      // TODO

      putSQS(defaultQueueUrl, JSON.stringify(request), function(err, data){
        if (err) {
          return console.error(err);
        }
        console.log("Added request to SQS successfully!");
      });
    }
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

wss.findClient = function findClient(uid) {
  var _ws = false;
  wss.clients.some(function outer(ws) {
    if (ws.uids) {
      ws.uids.some(function inner(_uid) {
        if (_uid === uid) {
          return (_ws = ws);
        }
      });
    }
    return _ws;
  });
  return _ws;
};

/**
 * AWS SQS
 */

var sqs =  new AWS.SQS();
var defaultQueueUrl = "https://sqs.eu-west-1.amazonaws.com/776851050546/fontdetective";

// Puts a message into the queue
function putSQS(queueUrl, value, callback) {
  var attributes = {
    uploaded: {
      DataType: "String",
      StringValue: Date.now().toString()
      }
  };
  putWithAttributesSQS(queueUrl, value, attributes, callback);
}

function putWithAttributesSQS(queueUrl, value, attributes, callback) {
  var params = {
    MessageBody: value,
    QueueUrl: queueUrl,
    MessageAttributes: attributes
  };
  sqs.sendMessage(params, callback);
}

function removeSQS(message, queueUrl, callback) {
    sqs.deleteMessage({
      QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle
    }, callback);
};

function receiveSQS(queueUrl, callback) {
  sqs.receiveMessage({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 60,
    WaitTimeSeconds: 3 
  }, function(err, data) {
    if (data.Messages) {
      // Only one message to get...
      var message = data.Messages[0];

      // Do something useful ...
      if (callback) {
        callback(err, message);
      }
    } else {
      // Queue is empty
      callback(err, null);
    }
  });
};

/**
 * AWS S3
 */

var s3 = new AWS.S3();
var defaultBucket = "font-detective-image-bucket";
var defaultFolder = "img";

// Puts a file in specified (bucket, key)
function putFileS3(filename, folder, key, bucket, metadata, callback) {
  var body = fs.createReadStream(filename);
  putS3(body, folder, key, bucket, metadata, callback);
}

// Puts data in specified (bucket, key)
// For now, this is public readable.
function putS3(body, folder, key, bucket, metadata, callback) {
  metadata.uploaded = Date.now().toString();
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
function getLinkS3(folder, key, bucket) {
  var fqkey = (folder != "") ? folder + "/" + key : key;
  return "https://s3-" + AWS.config.region + ".amazonaws.com/" + bucket.toString() + "/" + fqkey.toString();
}


/**
 * DyanmoDB
 */

var dynamodb = new AWS.DynamoDB();

function getJobDynamoDb(uid, callback) {
  var params = {
    Key: {
      uid: {
        S: uid
      }
    },
    AttributesToGet: [
      'uid',
      'url',
      'selection',
      'image',
      'results'
    ],
    TableName: 'results'
  };
  dynamodb.getItem(params, function(err, data) {
    if (err) {
      console.error(err.message);
    }
    console.log('Retrieved results from database');
    callback(data);
  });
};

function getClassifierDynamoDb(filename, callback) {
  var params = {
    Key: {
      filename: {
        S: filename
      }
    },
    AttributesToGet: [
      'filename',
      'description',
      'name'
    ],
    TableName: 'classifiers'
  };
  dynamodb.getItem(params, function(err, data) {
    if (err) {
      console.error(err.message);
    }
    console.log('Retrieved classifier from database');
    callback(data);
  });
};

/**
 * API
 */

// Uploads a file, first to the server, then to S3.
// Deletes the local copy when complete
exports.upload = function (req, res) {
  var fstream;
  var uid = req.params.uid;

  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    var path = __dirname + "/files/" + filename;
    fstream = fs.createWriteStream(path);
    file.pipe(fstream);
    fstream.on('error', function(err) {
      console.error(err.message);
    });
    fstream.on('close', function() {
      var key = (0|Math.random()*9e6).toString(36) + filename.replace(/ /g,'');
      console.log('FileStream has closed. Ising key ' + key);
      putFileS3(path, defaultFolder, key, defaultBucket, { uid: uid }, function(){
        // Send a message back via WS
        var ws = wss.findClient(uid);
        if (ws) {
          ws.send("url: " + getLinkS3(defaultFolder, key, defaultBucket));
        } else {
          console.error("Could not find WebSocket connection with UID. They must have disconnected.");
        }
        res.redirect("back");
        fs.unlink(path);
      });
    });
  });
};

// Finds a job in the database
exports.job = function (req, res) {
  var uid = req.params.uid;

  getJobDynamoDb(uid, function(data) {
    console.log('Got job data');
    console.log(data);
    res.send(data);
  });
};

// TODO - find n jobs

// Finds a job in the database
exports.classifier = function (req, res) {
  var fileName = req.params.filename;

  getClassifierDynamoDb(fileName, function(data) {
    console.log('Got classifier data');
    console.log(data);
    res.send(data);
  });
};
