const express = require('express');
const userRouter = require('./routers/user');
const portfolioRouter = require('./routers/portfolio');
const stockRouter = require('./routers/stock');
const reRouter = require('./routers/re');
const port = process.env.PORT;
require('./db/db');

const app = express();

var cors = require('cors');
app.use(cors());

app.use(express.json());
app.use(userRouter);
app.use(portfolioRouter);
app.use(stockRouter);
app.use(reRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})