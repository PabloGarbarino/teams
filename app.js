require('dotenv').config();

const express = require('express');
const hbs = require('hbs');
const path = require('path');
const app = express();
const port = process.env.APP_PORT;
const session = require('express-session');

var cors = require('cors')


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})

//MIDDLEWARES
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extented: false }))
app.use(express.static(__dirname + '/public'));
app.use(require('./router/router'))
app.use(cors())


//hbs
hbs.registerPartials(__dirname + "/views/partials/")