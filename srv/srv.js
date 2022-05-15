const compression = require('compression');
const express = require('express');
const app = express();
const port = process.env.DEVSRV_PORT || "3010";

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

app.use(express.static('../www/dev/'));
app.use(compression());

