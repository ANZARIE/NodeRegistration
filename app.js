const express = require("express");
const env = require("dotenv");

const app = express();
const port = 10000;

const cookieParser = require('cookie-parser');

env.config({
  path: "./.env",
});

// Define the default engine - Handlebars
app.set("view engine", "hbs");

// Parser for URL Data sent by Users from Forms
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Parser for Incoming JSON Data
app.use(express.json());

// Configure the Server to Listen to the specified Port
app
  .listen(port, () => {
    console.log(
      `\nServer successfully started at http://localhost:${port}`
    );
  })
  .on("error", (error) => {
    console.error(
      `\n!!! Server failed to start at Port: ${port} !!!\n${error.message}\n`
    );
  });

  
// Routes imported from other files
app.use("/", require("./routes/index.js"));
app.use("/register", require("./routes/registerRoutes.js"));
app.use(cookieParser());

