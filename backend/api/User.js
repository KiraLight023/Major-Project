const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// mongodb user model
const User = require("./../models/User");

// password handler
const bcrypt = require("bcrypt");
// const { getUserList } = require("./UserList");

//verify token
const verifyToken = async (req, res, next) => {
  const token = req.body.headers.authorization;
  if (token) {
    const tokenData = jwt.verify(token, process.env.SECRET);
    const email = tokenData.email;
    const user = await User.find({ email });
    if (user[0].role == "admin") {
      next();
    }
  } else {
    res.sendStatus(403);
  }
};

// Signup
router.post("/signup", (req, res) => {
  let { name, email, password } = req.body;
  const role = "reader";
  name = name.trim();
  email = email.trim();
  password = password.trim();

  if (name == "" || email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid email entered",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "pasword too short",
    });
  } else {
    //Checking if the user already exists
    User.find({ email })
      .then((result) => {
        if (result.length) {
          //A user already exists
          res.json({
            status: "FAILED",
            message: "User with the providede email already exists!",
          });
          () => {
            alert("User with this email already exists");
          };
        } else {
          //try to create new user

          // password hashing
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newUser = new User({
                name,
                email,
                password: hashedPassword,
                role,
              });

              newUser
                .save()
                .then((result) => {
                  res.json({
                    email,
                    name,
                    role,
                  });
                })
                .catch((err) => {
                  res.json({
                    status: "Failed",
                    message: "An error occured while saving user account!",
                    error: `The error says ${err}`,
                  });
                });
            })
            .catch((err) => {
              console.log(err);
              res.json({
                status: "FAILED",
                message: "An error occured while hashing password",
              });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: "FAILED",
          message:
            "An error occured while checking if the email already exists",
        });
      });
  }
});

// Signin
router.post("/signin", (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();
  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty credentials supplied",
    });
  } else {
    // check if user exist
    User.find({ email })
      .then((data) => {
        const token = jwt.sign({ email }, process.env.SECRET);
        const name = data[0].name;
        const role = data[0].role;
        if (data.length > 0) {
          const hashedPassword = data[0].password;
          bcrypt
            .compare(password, hashedPassword)
            .then((result) => {
              if (result) {
                // Password match
                res.json({
                  token,
                  email,
                  name,
                  role,
                });
              } else {
                res.json({
                  status: "FAILED",
                  message: "Invalid password entered!",
                });
              }
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "Invalid credentials entered!",
              });
            });
        } else {
          res.json({
            status: "FAILED",
            message: "NO user exists with this email",
          });
        }
      })
      .catch((err) => {
        console.log("error is " + err);
        res.json({
          status: "FAILED",
          message: "An error occured while checking for existing user",
        });
      });
  }
});

// users
router.post("/users", verifyToken, async (req, res) => {
  User.find()
    .then((Users) => res.json(Users))
    .catch((err) => res.json(err));
});

// role change
router.post("/rolechange", verifyToken, async (req, res) => {
  let { role, email } = req.body;
  role = role.trim();
  const user = await User.find({ email });

  User.updateOne(
    { email: user[0].email },
    {
      role: role,
    }
  )
    .then(
      res.json({
        status: 200,
      })
    )
    .catch((err) => {
      console.log(err);
      res.json({
        status: "failed",
        err: `error hai ${err}`,
      });
    });
});
module.exports = router;
