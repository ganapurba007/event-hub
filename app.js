const express = require("express");
const mysql = require("mysql2");
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();
const env = process.env;
const app = express();
const port = env.PORT;

const sequelize = new Sequelize(env.DB_NAME, env.DB_USERNAME, env.DB_PASSWORD, {
  host: env.DB_HOST || "localhost",
  dialect: "mysql",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
