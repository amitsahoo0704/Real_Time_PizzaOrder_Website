require('dotenv').config()
// Global error handlers to avoid process exit on unhandled errors
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err)
})
const express = require('express')
const app = express()   
const ejs = require('ejs')   
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 3000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')(session)
const passport = require('passport')
const Emitter = require('events')
const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

// Database connection (try ENV or constructed SRV, fall back to local MongoDB on failure)
const primaryConnection = process.env.MONGO_CONNECTION_URL || mongoURI;
const localFallback = `mongodb://127.0.0.1:27017/${process.env.MONGO_DB || 'pizza'}`;

async function connectWithFallback() {
    try {
        await mongoose.connect(primaryConnection, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: true
        });
        console.log('Database connected (primary)');
    } catch (err) {
        console.error('Primary mongoose connect error:', err.message || err);
        try {
            await mongoose.connect(localFallback, {
                useNewUrlParser: true,
                useCreateIndex: true,
                useUnifiedTopology: true,
                useFindAndModify: true
            });
            console.log('Database connected (local fallback)');
        } catch (err2) {
            console.error('Fallback mongoose connect error:', err2.message || err2);
        }
    }
}

connectWithFallback();

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connection open');
});
connection.on('error', (err) => {
    console.error('Database connection error:', err.message || err);
});

 
// Session store (resilient: fall back to MemoryStore on init failure)
let mongoStore
try {
    mongoStore = new MongoDbStore({
        mongooseConnection: connection,
        collection: 'sessions'
    })
    console.log('MongoDB session store initialized')
} catch (err) {
    console.error('Could not initialize MongoDB session store:', err.message || err)
    mongoStore = null
}

// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

// Session config
// Configure session options; only attach `store` when mongoStore initialized
const sessionOptions = {
    secret: process.env.COOKIE_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hour
}
if (mongoStore) sessionOptions.store = mongoStore

app.use(session(sessionOptions))
  
// Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())
// Assets
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})
// set Template engine
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')
//* payment :



console.log('SETUP: loading routes')
require('./routes/web')(app)
console.log('SETUP: routes loaded')
app.use((req, res) => {
    res.status(404).render('errors/404')
})

console.log('SETUP: starting server')

// Start server and handle EADDRINUSE by trying the next port
function startServer(startPort) {
    let port = Number(startPort) || 3000

    const tryListen = () => {
        const srv = app.listen(port)

        srv.on('listening', () => {
            console.log(`Listening on port ${port}`)

            // Attach Socket.IO after server is listening
            const io = require('socket.io')(srv)
            io.on('connection', (socket) => {
                socket.on('join', (orderId) => socket.join(orderId))
            })

            // Wire eventEmitter to io
            eventEmitter.on('orderUpdated', (data) => {
                io.to(`order_${data.id}`).emit('orderUpdated', data)
            })

            eventEmitter.on('orderPlaced', (data) => {
                io.to('adminRoom').emit('orderPlaced', data)
            })
        })

        srv.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.warn(`Port ${port} in use, trying ${port + 1}`)
                port = port + 1
                setTimeout(tryListen, 200)
            } else {
                console.error('Server error:', err)
            }
        })
    }

    tryListen()
}

startServer(PORT)

 