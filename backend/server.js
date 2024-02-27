//mongodb
require("./config/db");

const express = require("express");
const app = express();
const port = 3001;

const cors = require("cors");

const UserRouter = require("./api/User");

// For accepting post from data
const bodyParser = require("express").json;
app.use(bodyParser());
app.use(
  cors({
    origin: "*",
  })
);
app.use("/user", UserRouter);

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
