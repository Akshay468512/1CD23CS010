const express = require('express');
const logger = require('logging-middleware'); 
const app = express();


app.use(logger);

app.get('/', (req, res) => {
    res.send('Service is running');
});

app.listen(3000, () => console.log('Server started on port 3000'));