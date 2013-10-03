(function() {
  'use strict';

  // Game loop setup
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  window.requestAnimationFrame = requestAnimationFrame;

  function Game() {    
    var stage   = null,      
        socket  = null,
        playing = false,
        isDown  = false,
        isUp    = false,
        BOARDW  = 550,
        BOARDH  = 400,
        PADDLES = 85,
        XSPEED = 0.6,
        YSPEED = 0.3,
        player  = {},
        players = 0,
        score  = [0, 0],
        play   = false,
        elements = {
          text: {
            type: 'text'
          },
          balls: {
            type: 'ball',
            main: null
          },
          players: {
            type: 'player',
            one: {},
            two: {}
          }          
        },

        name = null;

    var init = function() {
      // Setup stage
      stage = new Kinetic.Stage({
        container: 'pong',
        width: BOARDW,
        height: BOARDH
      });

      // Default text
      elements.text.waiting_player1 = {
        text: "Waiting for player 1...",
        x: stage.getWidth() / 8,
        size: 14
      };

      elements.text.waiting_player2 = {
        text: "Waiting for player 2...",
        x: stage.getWidth() * 0.65,
        size: 14
      };      

      // Add the play ball
      elements.balls.main = {
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        directionX: 1,
        directionY: -1,
        radius: 4
      }

      // Sockets
      socket = io.connect("http://" + window.location.hostname + ':3500');

      // Socket events
      socket_events(socket);

      // Add player to game      
      if (name !== "null") {        
        window.setTimeout(function() {
          socket.emit('join', {
            name: "Test"
          });
        }, 500);      
      }    

      // Draw loop
      requestAnimationFrame(draw);
    },

    draw = function() {    
      stage.destroyChildren();
      
      for (var i in elements) {
        if (elements[i].type === 'text') {
          for (var j in elements[i]) {
            draw_text(elements[i][j]);            
          }
        }

        if (elements[i].type === 'ball') {
          for (var j in elements[i]) {
            draw_ball(elements[i][j]);            
          }
        }

        if (elements[i].type === 'player') {
          for (var j in elements[i]) {
            draw_player(elements[i][j]);            
          }
        }
      }  

      if (isDown) {
        socket.emit('down', {
          y: player.y
        });
      } 

      if (isUp) {
        socket.emit('up', {
          y: player.y
        });
      }             

      requestAnimationFrame(draw);
    },

    draw_text = function(settings) {
      if (typeof(settings) !== 'object') return;

      var layer = new Kinetic.Layer();

      var text = new Kinetic.Text({
        x: settings.x || ((stage.getWidth() / 2) - (settings.text.length * 5)),
        y: settings.y || 30,
        text: settings.text,
        fontSize: settings.size || 24,
        fill: settings.fill || 'white'
      });

      layer.add(text);     
      stage.add(layer);
    },

    draw_ball = function(settings) {
      if (typeof(settings) !== 'object') return;

      var layer = new Kinetic.Layer();

      var ball = new Kinetic.Circle({
        x: settings.x,
        y: settings.y,
        radius: settings.radius,
        fill: settings.fill || 'white'        
      });

      // Add to canvas
      layer.add(ball);
      stage.add(layer);
    },

    draw_player = function(settings) {
      if (typeof(settings) !== 'object') return;

      var layer = new Kinetic.Layer();

      var player = new Kinetic.Line({        
        points: [{
          x: settings.x, 
          y: settings.y
        },

        {
          x: settings.x,
          y: settings.y + settings.size
        }],

        stroke: 'white'
      });

      layer.add(player);
      stage.add(layer);
    },

    bind_controls = function(cplayer) {      
      player = cplayer === 1 ? elements.players.one : elements.players.two;          

      Mousetrap.bind('w', function() {
        if (isUp === false) {
          socket.emit('up', {
            move: true
          });
        }

        isUp = true;                

        return false;
      });

      Mousetrap.bind('w', function() {
        if (isUp === true) {
          socket.emit('up', {
            move: false
          });
        }

        isUp = false;
        
        return false;
      }, 'keyup');

      Mousetrap.bind('s', function() {
        if (isDown === false) {
          socket.emit('down', {
            move: true
          });
        }

        isDown = true;        

        return false;
      });

      Mousetrap.bind('s', function() {
        if (isDown === true) {
          socket.emit('down', {
            move: false
          });
        }

        isDown = false;        

        return false;
      }, 'keyup');
    },

    socket_events = function(socket) {
      socket.on('player1', function(data) {
        if (typeof(elements.text.waiting_player1) !== 'undefined') {
          delete elements.text.waiting_player1;
        }      

        delete elements.text.player_one_joined;
        elements.text.player_one_joined = {
           text: data.name + " has joined...",
            x: stage.getWidth() / 8,
            size: 14,
            duration: 2500
        };

        delete elements.players.one;
        elements.players.one = {
          name: data.name,
          x: 20,
          y: (stage.getHeight() / 2) - 50,
          size: PADDLES
        }

        if (data.name === name) {
          bind_controls(1);
        }        

        players++;

        window.setTimeout(function() {
          delete elements.text.player_one_joined;
          delete elements.text.player_one;

          elements.text.player_one = {
            text: data.name,
            x: stage.getWidth() / 8,
            y: stage.getHeight() - 40,
            size: 18
          };          

          elements.text.score1 = {
            text: score[0],
            x: stage.getWidth() / 8,
            size: 28
          };
        }, 2500);
      });

      socket.on('player2', function(data) {
        if (typeof(elements.text.waiting_player2) !== 'undefined') {
          delete elements.text.waiting_player2;
        }

        delete delete elements.text.player_two_joined;
        elements.text.player_two_joined = {
           text: data.name + " has joined...",
            x: stage.getWidth() * 0.65,
            size: 14,
            duration: 2500
        };      

        delete elements.players.two;
        elements.players.two = {
          name: data.name,
          x: stage.getWidth() - 20,
          y: (stage.getHeight() / 2) - 50,
          size: PADDLES
        }

        if (data.name === name) {                                          
          bind_controls(2);
        }

        players++;

        window.setTimeout(function() {
          delete elements.text.player_two_joined;
          delete elements.text.player_two;

          elements.text.player_two = {
            text: data.name,
            x: stage.getWidth() * 0.75,
            y: stage.getHeight() - 40,
            size: 18
          };          

          elements.text.score2 = {
            text: score[1],
            x: stage.getWidth() * 0.75,
            size: 28
          };
        }, 2500);
      });

      socket.on('ball move', function(data) {        
        elements.balls.main.x = data.x;
        elements.balls.main.y = data.y;

        elements.players.one.y = data.playerCoords[0];
        elements.players.two.y = data.playerCoords[1];
      });

      socket.on('winner', function(data) {
        elements.text.winner = {
          text: data.message,
          x: stage.getWidth() / 6,
          y: stage.getHeight() / 2,
          size: 32
        }
      });

      socket.on('score', function(data) {
        elements.text.score1.text = data.score[0];
        elements.text.score2.text = data.score[1];
      });

      socket.on('name', function(data) {
        name = data.name;
      })
    };        

    init();

    return {
      stage: stage
    }
  }

  $(document).ready(function() {
    window.game = Game();
  });
})();