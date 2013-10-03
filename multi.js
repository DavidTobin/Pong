var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , sleep = require('sleep');

server.listen(3500);

var players = {
  one: {
    name: null,
    joined: false
  },

  two: {
    name: null,
    joined: false
  }
},

SPEED = 10,
BOARDH = 400,
BOARDW = 550,
PADDLES = 85,
XSPEED = 0.9,
YSPEED = 0.4,

movement = [false, false, false, false],

winner = false,

ballX = 650 / 2,
ballY = 650 / 2,

score = [0, 0];

ballXDirection = 1,
ballYDirection = -1,

playerCount = 0,

player = [{}, {}, {}];

player[1].position = [BOARDH / 2, ((BOARDH / 2) + PADDLES)];
player[2].position = [BOARDH / 2, ((BOARDH / 2) + PADDLES)];


io.sockets.on('connection', function (socket) {  
  // Check existing players
  if (players.one.joined === true) {
    socket.emit('player1', {
      name: players.one.name
    });
  }

  if (players.two.joined === true) {
    socket.emit('player2', {
      name: players.two.name
    });
  }

  socket.on('join', function(data) {    
    data.name = data.name || "anon";    

    setTimeout(function() {
      playerCount++;
    }, 2500); 

    // Check to see if we need players
    if (players.one.joined === false) {
      socket.set('name', "Player 1");
      data.name = "Player 1";
      socket.set('player', 1);

      socket.emit('name', {
        name: data.name
      });

      io.sockets.emit('player1', {
        name: "Player 1"
      });

      players.one.name    = data.name;
      players.one.joined  = true;      
    } else if (players.two.joined === false) {
      socket.set('name', "Player 2");
      socket.set('player', 2);

      data.name = "Player 2";

      socket.emit('name', {
        name: data.name
      });

      io.sockets.emit('player2', {
        name: "Player 2"
      });

      players.two.name    = data.name
      players.two.joined  = true;      
    } 
    
  });

  socket.on('up', function(data) {
    var me = 0;
    socket.get('player', function(error, player) {
      me = player;
    });  

    if (me === 1 && typeof(data.move) !== 'undefined') {
      movement[0] = data.move;
    } else if (me === 2 && typeof(data.move) !== 'undefined') {
      movement[2] = data.move;
    }    
  });

  socket.on('down', function(data) {
    var me = 0;
    socket.get('player', function(error, player) {
      me = player;
    });  

    if (me === 1 && typeof(data.move) !== 'undefined') {
      movement[1] = data.move;
    } else if (me === 2 && typeof(data.move) !== 'undefined') {
      movement[3] = data.move;
    }
  });

  var ballMove = setInterval(function() {
    if (playerCount >= 2 && winner === false) {
      if (movement[0]) {
        player[1].position[0]--; 
        player[1].position[1]--;   
      }

      if (movement[1]) {
        player[1].position[0]++;
        player[1].position[1]++;
      }

      if (movement[2]) {        
        player[2].position[0]--;
        player[2].position[1]--;
      }

      if (movement[3]) {
        player[2].position[0]++;
        player[2].position[1]++;
      } 

      ballX += XSPEED * ballXDirection;
      ballY += YSPEED * ballYDirection;

      if (ballX >= BOARDW) {
        ballXDirection = -1
      } else if (ballX <= 0) {
        ballXDirection = 1;
      }

      if (ballY >= BOARDH) {
        ballYDirection = -1
      } else if (ballY <= 0) {
        ballYDirection = 1;
      }

      if (ballY > player[1].position[0] && ballY < player[1].position[1] && ballX >= 20 && ballX <= 28) {
        ballXDirection *= -1;

        XSPEED += 0.05;
        YSPEED += 0.025;
      }

      if (ballY > player[2].position[0] && ballY < player[2].position[1] && ballX <= (BOARDW - 20) && ballX >= (BOARDW - 35)) {
        ballXDirection *= -1;

        XSPEED += 0.05;
        YSPEED += 0.025;
      }      

      if (ballX <= 1) {
        score[1]++;

        ballX = BOARDW / 2;
        ballXDirection = 1;

        io.sockets.emit('score', {
          score: score
        });

        playerCount = 0;
        setTimeout(function() {
          playerCount = 2;
        }, 2500);

        XSPEED = 0.9;
        YSPEED = 0.4;
      }                                      

      if (ballX >= BOARDW - 1) {
        score[0]++;

        io.sockets.emit('score', {
          score: score
        });

        ballX = BOARDW / 2;
        ballXDirection = -1;

        playerCount = 0;
        setTimeout(function() {
          playerCount = 2;
        }, 2500);

        XSPEED = 0.9;
        YSPEED = 0.4;
      }

      if (score[0] === 5 || score[1] === 5) {
        clearInterval(ballMove);

        var message = score[0] === 5 ? "Player 1 is the winner." : "Player 2 is the winner.";

        io.sockets.emit('winner', {
          message: message
        });
      }

      socket.emit('ball move', {
        x: ballX,
        y: ballY,
        playerCoords: [player[1].position[0], player[2].position[0]]
      });      
    }
  }, 20);    

  socket.on('disconnect', function() {    

    socket.get('name', function(err, name) {
      if (name === players.one.name) {
        players.one.joined  = false;
        players.one.name    = null;              
      }

      if (name === players.two.name) {
        players.two.joined  = false;
        players.two.name    = null;                
      }      
    });
  });
});