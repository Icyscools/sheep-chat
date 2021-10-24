const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html")
})

// Socket.io
let sockets = []
let avaliableRooms = []
io.on("connection", (socket) => {
  sockets = [...sockets, socket]
  const leaveAllRoom = () => {
    socket.rooms.forEach((room) => {
      socket.leave(room)
    })
  }

  socket.on("create room", () => {
    leaveAllRoom()
    const roomId = "abc" + Math.floor(1 + Math.random() * 2)
    if (!avaliableRooms.includes(roomId)) {
      avaliableRooms = [...avaliableRooms, roomId]
    }
    socket.join(roomId)
    io.to(roomId).emit("chat message", "Creating new room: " + roomId)
  })

  socket.on("join random", () => {
    leaveAllRoom()
    if (avaliableRooms.length > 0) {
      const roomId = avaliableRooms[Math.floor(Math.random() * avaliableRooms.length)]
      avaliableRooms = avaliableRooms.filter((room) => room !== roomId)
      socket.join(roomId)
    } else {
      socket.emit("send message", "No avaliable rooms here")
    }
  })

  socket.on("chat message", (msg) => {
    console.log(socket.rooms)
    socket.rooms.forEach((room) => {
      io.to(room).emit("send message", `${socket.id}: ${msg}`)
    })
  })

  socket.on("send message", (msg) => {
    socket.emit("send message", msg)
  })

  socket.on("disconnecting", () => {
    console.log(socket.rooms) // the Set contains at least the socket ID
  })

  socket.on("disconnect", () => {
    if (socket.rooms.size > 0) leaveAllRoom()
  })
})

// Room events
io.of("/").adapter.on("create-room", (room) => {
  if (avaliableRooms.includes(room)) {
    console.log(`room ${room} was created`)
  }
})

io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`)
  io.to(room).emit("send message", `${id} has joined room ${room}`)
})

io.of("/").adapter.on("leave-room", (room, id) => {
  console.log(`socket ${id} has leaved room ${room}`)
})

server.listen(3000, () => {
  console.log("listening on *:3000")
})
