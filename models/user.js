const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "registeration",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      password: {
        type: DataTypes.STRING,
        set(value) {
          const salt = bcrypt.genSaltSync(12);
          const hash = bcrypt.hashSync(value, salt);
          this.setDataValue("password", hash);
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
    },
    {
      timestamps: false,
    }
  );
  User.generateToken = function (registeration) {
    const jwtSecretKey = "samridhiahuja";

    const payload = {
      userId: registeration.id,
      username: registeration.name,
    };
    return jwt.sign(payload, jwtSecretKey, { expiresIn: "1h" }); // Token expires in 1 hour
  };
  
  User.verifyToken = function (token) {
    const jwtSecretKey = "samridhiahuja";
    try {
      const decoded = jwt.verify(token, jwtSecretKey);
      return decoded;
    } catch (err) {
      throw new Error("Invalid or expired token");
    }
  };

  return User;
};
