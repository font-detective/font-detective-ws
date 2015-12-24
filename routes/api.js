/*
 * Serve JSON to our AngularJS client
 */

var fs = require('fs');
var AWS = require('aws-sdk');

// Set location to Ireland
AWS.config.region = "eu-west-1";

var s3 = new AWS.S3();
var defaultBucket = "fontdetective";

// Puts a file in specified (bucket, key)
function putFileS3(filename, key, bucket, callback) {
  var body = fs.createReadStream(filename);
  putS3(body, key, bucket, callback);
}

// Puts data in specified (bucket, key)
function putS3(body, key, bucket, callback) {
  var metadata = { uploaded: Date.now().toString() };
  var s3obj = new AWS.S3({params: {Bucket: bucket, Key: key, Metadata: metadata}});
  s3obj.upload({Body: body}).
    on("httpUploadProgress", function(evt) { console.log((evt.loaded / evt.total).toFixed(2)*100 + "%") }).
    send(callback);
}

// Gets a file in specified (bucket, key)
function getFileS3(filename, key, bucket, callback) {
  var params = {Bucket: bucket, Key: key};
  var file = require('fs').createWriteStream(filename);
  s3.getObject(params).createReadStream().on("finish", callback).pipe(file);
}

// Gets data from specified (bucket, key)
// returns a callback with err, data
function getS3(callback, key, bucket, callback) {
  var params = {Bucket: bucket, Key: key};
  s3.getObject(params, callback).send();
}

// Gets the link at which the resource may be accessed
function getLink(key, bucket) {
    return "https://s3-eu-west-1.amazonaws.com/" + bucket.toString() + "/" + key.toString();
}

exports.upload = function (req, res) {
	var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        var path = __dirname + '/../files/' + filename;
        fstream = fs.createWriteStream(path);
        file.pipe(fstream);
        fstream.on('close', function () {
            putFileS3(path, filename, defaultBucket, function(){
                console.log(getLink(filename, defaultBucket));
                res.redirect('back');
            });
        });
    });
}