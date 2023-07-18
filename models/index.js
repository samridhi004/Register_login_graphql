const sequelize = require("../config/db")
const {Sequelize,DataTypes} = require("sequelize")
const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.sequelize.sync({alter:true}).then(()=>{
    console.log("database synced");
})

db.users= require("./user")(sequelize,DataTypes)

module.exports = db