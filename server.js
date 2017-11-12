const express = require("express");
const socketIO = require("socket.io");
const path = require("path");

console.log("Starting server!");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");
require("dotenv").config();

const server = express()
  // .use((req, res) => res.sendFile(INDEX))
  .use(express.static(path.join(__dirname, "public")))
  .get("/", function(req, res) {
    res.sendFile(INDEX);
  })
  .get("*", function(req, res) {
    res.redirect("/");
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const watson = require("watson-developer-cloud");
const api_userName = process.env.api_username;
console.log("api_user", api_userName);

const api_password = process.env.api_password;
var tone_analyzer = watson.tone_analyzer({
  username: api_userName,
  password: api_password,
  version: "v3",
  version_date: "2016-05-19",
});

const io = socketIO(server);
let numUsers = 0;
let savedMsgArr = [];

function saveMessages(message, username) {
  if (savedMsgArr.length > 10) {
    savedMsgArr.shift();
  }
  savedMsgArr.push({ username: message });
}

io.on("connection", function(socket) {
  var addedUser = false;

  function getMood(text) {
    console.log("working");

    tone_analyzer.tone(
      {
        text: text,
      },
      function(err, tone) {
        if (err) {
          console.log("error!!!!!!!!!!!!");

          return err;
        } else {
            console.log('working sending data');
            
          socket.broadcast.emit("new tone analyzer data", {
            toneData: tone,
          });
        }
      }
    );
  }

  // when the client emits 'new message', this listens and executes
  socket.on("new message", function(data) {
    saveMessages(data, socket.username);
    console.log("dtata:", data);
    // getMood(data);
    // we tell the client to execute 'new message'
    socket.broadcast.emit("new message", {
      username: socket.username,
      message: data,
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on("add user", function(username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit("login", {
      numUsers: numUsers,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on("typing", function() {
    socket.broadcast.emit("typing", {
      username: socket.username,
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on("stop typing", function() {
    socket.broadcast.emit("stop typing", {
      username: socket.username,
    });
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function() {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers,
      });
    }
  });
});
