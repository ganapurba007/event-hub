const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();
const env = process.env;
const app = express();
const port = env.PORT;

const connection = mysql.createConnection({
  host: env.DB_HOST,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.log("Error connecting to DB", err);
  } else {
    console.log("Connected to DB");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
