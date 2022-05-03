const compression = require('compression');
const express = require('express');
const app = express();
const port = 3010;

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

app.use(express.static('static'));
app.use(compression());

