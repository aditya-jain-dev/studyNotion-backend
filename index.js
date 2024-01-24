const express = require('express');
const db = require('./config/database');

const app = express();
require('dotenv').config();

// connect db
db.connect();

// middlewares
app.use(express.json());

// test route
app.get('/', (req, res) => {
    res.send('welcome to studyNotion backend....')
})

app.listen(process.env.PORT, () => {
    console.log(`server running at ${process.env.API_URL}`);
})