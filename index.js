require('dotenv').config()

const app = require('express')()
const port = process.env.PORT
const fs = require('fs')

console.log({ type: typeof process.env.SSL_ENABLED })

const http = require('http').createServer(
  process.env.SSL_ENABLED === 'true' ? {
    key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  } : {}, app)
const io = require('socket.io')(http)

const SteamAPI = require('steamapi')
const steam = new SteamAPI(process.env.STEAM_KEY)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL)
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

  socket.on('SetGames', (games, callback) => {
    console.log(`Emitting 'SetGames' with ${games.length} total games`)
    const returnData = {
      success: games.length > 0,
      games
    }
    callback && callback(returnData)
    io.emit('SetGames', games)
  })

  socket.on('SpinStart', (callback) => {
    console.log('Starting spin...')
    callback && callback()
    io.emit('SpinStart')
  })

  socket.on('ResetWheel', (callback) => {
    console.log('Resetting wheel')
    callback && callback()
    io.emit('ResetWheel')
  })

  socket.on('SpinEnd', (game, callback) => {
    console.log(`Recieved winning game: '${game.label}'`)
    const returnData = {
      ...game
    }
    callback && callback(returnData)
    io.emit('SpinEnd', game)
  })

  socket.on('disconnect', () => {
    console.log('client disconnected')
  })
})

http.listen(port, () => console.log(`Game Wheel Backend running on port ${port}`))
