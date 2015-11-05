var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var img = new Image();

// Used, with love, from http://jsbin.com/funewofu
function drawImageScaled(img, ctx) {
var canvas = ctx.canvas ;
var hRatio = canvas.width  / img.width    ;
var vRatio =  canvas.height / img.height  ;
var ratio  = Math.min ( hRatio, vRatio );
var newWidth = img.width * ratio;
var newHeight = img.height * ratio;
var centerShift_x = ( canvas.width - newWidth ) / 2;
var centerShift_y = ( canvas.height - newHeight ) / 2;
ctx.clearRect(0,0,canvas.width, canvas.height);
ctx.drawImage(img, 0,0, img.width, img.height,
                  centerShift_x, centerShift_y, newWidth, newHeight);
return {
    x: centerShift_x,
    y: centerShift_y,
    width: newWidth,
    height: newHeight
};
}

img.onload = function() {
// Draw image
var coords = drawImageScaled(img, ctx);

// Draw bounding box
// This is 50% gray
ctx.save();
ctx.fillStyle = "rgba(225, 225, 225, 0.5)";
ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
ctx.restore();
};
img.src = "img/cup.jpg";
