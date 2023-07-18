const express = require("express");
const app = express();
const { buildSchema } = require("graphql");
const { graphqlHTTP } = require("express-graphql");
const expressPlayground =
  require("graphql-playground-middleware-express").default;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PORT = 3000;
const db = require("./models/");
const { Op } = require("sequelize");

const schema = buildSchema(` 
type loginResponse{
    Data: User
    message: String
    token:String
}
    type User{
        id:Int
        name:String
        password:String
        email:String
    }
    type pageInfo{
      hasNextPage:Boolean
      hasPreviousPage:Boolean
      startCursor:String
      endCursor:String
    }
    type UserEdge {
      cursor: String
      node: User
    }
    type UserConnection {
      edges: [UserEdge]
      pageInfo: pageInfo
    }
    type Query{
        hello:String
        getUsers:[User]
        limitUser(skip: Int, limit: Int) :[User]
        userPagination(first:Int,after:String,last:Int,before:String):UserConnection
    } 
    input userInput{
        id:Int
        name:String
        password:String
        email:String

    }
    input loginInput{
      email:String
        password:String
    }

    type Mutation{
        addUser(user:userInput):User
        loginUser(user:loginInput):loginResponse
        updateUser(user:userInput): User
        deleteUser(user: userInput): User
    }
`); //! is used when compulsory required condition is used

const root = {
  hello: () => {
    return "hello world!";
  },
  getUsers: async (args, req) => {
    const Users = db.users;
    const verifyMe = req.headers.token;
    console.log(">>>>>>>>>>>>", req.headers.token);

    const decoded = await Users.verifyToken(verifyMe);
    console.log(decoded.username);

    try {
      
      const data = await Users.findAll({ where: { name: decoded.username }});
      if (data.length === 0) {
        throw new Error("User not found");
      }

      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  },
  limitUser : async(args)=>{
    const Users = db.users;
    // args.limit? args.limit : args.limit= 10;
    // args.skip? args.skip: args.skip = 0;
    let {limit=10,skip=0} = args //destructuring
    console.log(`limit ${limit}`);
    console.log(`skip ${skip}`);
    const data = await Users.findAll({
      limit,
      offset:skip,
    });
    return data
  },
  userPagination: async (_, { first, after, last, before }) => {
    const Users = db.users;

    let where = {};
    let order = [["id", "ASC"]];
    let limit = first || last || 5;
    let offset = 0;

    if (after) {
      where.id = { [Op.gt]: parseInt(after, 5) };
    }

    if (before) {
      where.id = { [Op.lt]: parseInt(before, 5) };
      order = [["id", "DESC"]];
    }

    if (last) {
      limit = last;
    }

    if (after || before) {
      const pages = await Users.findOne({
        where,
        order,
        attributes: ["id"],
      });

      if (pages) {
        offset = order[0][1] === "ASC" ? pages.id - 1 : pages.id + 1;
      }
    }

    const pages = await Users.findAll({ where, order, limit });
    //page.length >0 means more records available
    const hasNextPage = pages.length > limit - 1;
    const hasPreviousPage =
      !!after || (before && pages.length > 0) || offset > 0;
    const startCursor = pages.length > 0 ? pages[0].id.toString() : null;
    const endCursor =
      pages.length > 0 ? pages[pages.length - 1].id.toString() : null;

    return {
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
      },
      edges: pages.map((p) => ({
        node: p,
        cursor: p.id.toString(),
      })),
    };
  },
  addUser: async (args, context) => {
    const Users = db.users;
    const data = await Users.create(args.user);
    return data;
  },
  loginUser: async (args, context) => {
    const Users = db.users;
    console.log(db.sequelize.models);

    const data = await Users.findOne({ where: { email: args.user.email } });
    if (!data) {
      throw new Error("user not found!");
    }

    const passwordComp = await bcrypt.compare(
      args.user.password,
      data.password
    );

    console.log(passwordComp);
    console.log("data->>>", data);
    if (passwordComp) {
      const token = await Users.generateToken(data);
      console.log(token);
      return { Data: data, message: "login sucess....", token };
    } else {
      return { Data: null, message: "invalid login" };
    }
  },

  updateUser: async (args, context) => {
    try {
      const Users = db.users;
      console.log(typeof args.user.id);
      const data = await Users.update(
        { name: args.user.name, email: args.user.email },
        { where: { id: args.user.id }, returning: true }
      );
      console.log(data[1][0].dataValues);
      return data[1][0].dataValues;
    } catch (error) {
      console.log(error);
    }
  },

  deleteUser: async (args, context) => {
    const Users = db.users;

    const record = await Users.findOne({
      where: {
        [Op.or]: [
          { id: args.user.id },
          { name: args.user.name },
          { email: args.user.email },
        ],
      },
    });
    if (!record) {
      throw new Error("Record not found");
    }
    await record.destroy();
  },
};

app.use(
  "/graphql",
  graphqlHTTP((req) => ({
    schema,
    rootValue: root,
    graphiql: true,
    context: req,
  }))
);

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});
