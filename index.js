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
