const Sequelize = require("sequelize");

const sequelize = new Sequelize("workplace", "postgres", "samridhi18", {
  host: "localhost",
  dialect: "postgres",
  logging: false
});

sequelize.authenticate()
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = sequelize;
