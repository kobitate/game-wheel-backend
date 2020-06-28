require('dotenv').config()

const app = require('express')()
const http = require('http').createServer(app)
const port = process.env.PORT
const io = require('socket.io')(http)

const SteamAPI = require('steamapi')
const steam = new SteamAPI(process.env.STEAM_KEY)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://kobi.dev')
  if (process.env.DEVELOPMENT === 'true') {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Credentials', true)
  next()
})

app.get('/games/:id', (req, res) => {
  steam.getUserOwnedGames(req.params.id).then(games => {
    res.send(games)
  })
})

io.on('connection', socket => {
  console.log('client connected')

  socket.on('SetGames', games => {
    console.log(`Emitting 'SetGames' with ${games.length} total games`)
    io.emit('SetGames', games)
  })

  socket.on('disconnect', () => {
    console.log('client disconnected')
  })
})

http.listen(port, () => console.log(`Game Wheel Backend running on port ${port}`))
