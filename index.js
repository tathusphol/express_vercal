const express = require("express")
var cors = require('cors')
const path = require("path")
const bodyParser = require('body-parser')
const app = express();
app.use(cors())
// Statics
app.use(express.static('static'))

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'static')))

app.use(bodyParser.urlencoded({ extended: false}));
// Config Router
// routers
const indexRouter = require('./routes/index')
const loginRouter = require('./routes/login')
const sellRouter = require('./routes/seller')
const carRouter = require('./routes/car')
const userRouter = require('./routes/user')
const customerRouter = require('./routes/customer')
const adminRouter = require('./routes/admin')


app.use(indexRouter.router)
app.use(loginRouter)
app.use(sellRouter)
app.use(carRouter)
app.use(userRouter)
app.use(customerRouter)
app.use(adminRouter)

app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:3000`)
})