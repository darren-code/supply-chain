'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const utils = require('./utils.js');
const router = require('./router.js');

app.use(bodyParser.json({limit: '5mb'}));
app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    next();
});

app.use(cors());

app.use('/api', router);

app.get('/ping', (req, res) => {
    res.send('Response from backend server');
});

async function main() {
    try {
        await utils.connectGatewayFromConfig();
        await utils.events();
    } catch (error) {
        return console.log('Error in connecting to Fabric network. ', error);
    }

    const port = process.env.PORT || 3000;
    app.listen(port, (error) => {
        if (error) {
            return console.log('Error: ' + err);
        }
    })
}

main();