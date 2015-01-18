var http = require('http');
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var i2c = require('i2c');

var address = 0x12;
var wire = new i2c(address);

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

function puts(error, stdout, stderr) {sys.puts(stdout)}

io.sockets.on('connection', function (socket) {

    console.log('Un client est connecté');

    socket.on('motors', function(rightSide, leftSide)
    {
      wayRightSide = -1;
      wayLeftSide = -1;
      rightSideSpeed = 0;
      leftSideSpeed = 0;

      if (rightSide > 0) {
        wayRightSide = 1
        rightSideSpeed = rightSide * 2.5;
      }
      else if (rightSide < 0) {
        wayRightSide = 0;
        rightSideSpeed = rightSide * (-2.5);
      }
      else {
        wayRightSide = 0;
        rightSideSpeed = 0;
      }

      if (leftSide > 0) {
        wayLeftSide = 1
        leftSideSpeed = leftSide * 2.5;
      }
      else if (leftSide < 0) {
        wayLeftSide = 0;
        leftSideSpeed = leftSide * (-2.5);
      }
      else {
        wayLeftSide = 0;
        leftSideSpeed = 0;
      }

      rightSpeedOrder = parseInt(rightSideSpeed);
      leftSpeedOrder = parseInt(leftSideSpeed);

      console.log('Envoi');

      sendDATA(rightSpeedOrder, leftSpeedOrder, wayRightSide, wayLeftSide);
    });

    socket.on('camera', function(upDown, rightLeft) {

    cmd = 'python commandCamera.py ' + upDown + ' ' + rightLeft;

	  exec(cmd, puts);
  });

});

function sendDATA(rightSpeedOrder, leftSpeedOrder, wayRightSide, wayLeftSide) {

      wire.writeByte(255);
      wire.writeByte(13);
      wire.writeByte(rightSpeedOrder);
      wire.writeByte(wayRightSide);

      wire.writeByte(255);
      wire.writeByte(24);
      wire.writeByte(leftSpeedOrder);
      wire.writeByte(wayLeftSide);

      console.log('ENVOYE');
}


server.listen(3000);
