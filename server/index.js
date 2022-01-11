const http = require('http');
const mongoose = require('mongoose');
const app = require('./routes/app');

const password = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DB
mongoose.connect("mongodb+srv://Ryednap:" + password + "@authcluster.xesir.mongodb.net/" + dbName + "?retryWrites=true&w=majority",
    { keepAlive: true, keepAliveInitialDelay: 30000 })
    .then((data) => {
        console.log('Connected to the Database');
    }).catch(err => console.log(err));

const server = http.createServer(app);
const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Server is up and running at Port ${port}`);
});