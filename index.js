const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express();

app.use(cors()); 
app.use(express.json());  

app.get("/", (req, res) => {
  res.status(200).json({});
});

const routesBooks = require("./src/book/book.route");
app.use("/books", routesBooks);

const routesAuth = require("./src/auth/auth.route");
app.use("/users", routesAuth);

const routesUser = require("./src/user/user.route");
app.use("/users", routesUser);

const routesOrder = require("./src/order/order.route");
app.use("/orders", routesOrder);
 
mongoose.connect(
    "mongodb+srv://jhimi321123:nsS0WaQxcX8LnJiq@cluster0.t6xactb.mongodb.net"
);

module.exports = app;