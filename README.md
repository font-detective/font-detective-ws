```
  __             _            _      _            _             
 / _| ___  _ __ | |_       __| | ___| |_ ___  ___| |_ ___  _ __ 
| |_ / _ \| '_ \| __|____ / _` |/ _ \ __/ _ \/ __| __/ _ \| '__|
|  _| (_) | | | | ||_____| (_| |  __/ ||  __/ (__| || (_) | |   
|_|  \___/|_| |_|\__|     \__,_|\___|\__\___|\___|\__\___/|_|   
                                                                
+ - - - Identify fonts in the cloud! - - - - - - - - - - - - - +
```

A cloud-based web application designed to process uploaded image samples and identify a font present. The application makes use of Amazon Web Services and to run it yourself you will need to configure your own instances; a recipe for doing this can be found at [NETWORK.md](NETWORK.md).

WebSockets Protocol
===================

The following WebSockets protocol has been defined for use within the application.

Client
------
```
wsid: [unique ID]	- sends a unique client ID to the web server. This is an alphanumeric string.
```

Web server
----------
```
state: ["uploaded"]	- sends a state message to the client.
url: [image URL]	- sends a URL to the client. The context is state dependent.
```

Resources
=========

As with [almost] all JavaScript applications, [jQuery](https://jquery.com/) has been used.

The web server back-end has been implemented using [Node.js](https://nodejs.org) with [Express](http://expressjs.com/).

The DropZone library is a JavaScript utility for managing file upload via drag and drop. It can be found [here](http://www.dropzonejs.com/).

The imgAreaSelect library is a JavaScript utility for selecting a rectangular area of an image. It can be found [here](http://odyniec.net/projects/imgareaselect/).

Left and Right icons by Heberti Almeida from [The Noun Project](https://thenounproject.com/).
