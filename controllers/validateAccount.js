const mysql = require("mysql2");
const bcrypt = require("bcrypt");
// const async = require("hbs/lib/async");
// const { param } = require("../routes/registerRoutes");
const jwt = require('jsonwebtoken');



const db = mysql.createConnection({
  database: process.env.DATABASE,
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  port: process.env.DATABASE_PORT,
  password: process.env.DATABASE_PASSWORD,
});

// Login
exports.signin = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT email FROM accounts WHERE email = ?",
    email,
    async (error, results) => {
      console.log(results);

      if (error) {
        console.log(error.message);
      }

      if (email === "" || password === "") {
        res.render("index.hbs", {
          message: `Email and Password should not be empty.`,
          category: "alert alert-danger text-center",
        });
      } else {
        db.query(
          "SELECT email, password FROM accounts WHERE email = ?",
          email,
          async (error, results) => {
            console.log(results);

            if (!results.length > 0) {
              res.render("index.hbs", {
                message: `Email does not exist`,
                category: "alert alert-danger text-center",
              });
            } else if (
              !(await bcrypt.compare(password, results[0].password))
            ) {
              res.render("index.hbs", {
                message: `Incorrect password`,
                category: "alert alert-danger text-center",
              });
            } else {
              const account_id = results[0].account_id;
              const token = jwt.sign({account_id}, process.env.JWTSECRET, {expiresIn: process.env.JWTEXPIRES});
              const cookieOptions = {
                expires: new Date(Date.now() + process.env.COOKIEEXPIRE * 24 * 60 * 60 * 1000),
                httpOnly: true
              };
              res.cookie('JWT', token, cookieOptions);
              
              console.log(cookieOptions);
              console.log(account_id);
              

              db.query(
                "SELECT * FROM accounts ORDER BY account_id",
                (error, results) => {
                  console.log(results);

                  res.render("accountsList.hbs", {
                    header: "List of Users",
                    data: results,
                  });
                }
              );
            }
          }
        );
      }
    }
  );
};



// Sign Up
exports.signup = (req, res) => {
  try {
    const { first_name, last_name, email, password, confirm_password } =
      req.body;

    db.query(
      "SELECT email FROM accounts WHERE email = ?",
      email,
      async (error, results) => {
        console.log(results);

        if (error) {
          console.log(error.message);
        }

        if (results.length > 0) {
          res.render("register.hbs", {
            message: `This email is already existing.`,
            category: "alert alert-danger text-center",
          });
        } else if (confirm_password !== password) {
          res.render("register.hbs", {
            message: `Password and Confirm Password should match.`,
            category: "alert alert-danger text-center",
          });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query(
          "INSERT INTO accounts SET ?",
          {
            first_name,
            last_name,
            email,
            password: hashedPassword,
          },
          (error, results) => {
            if (error) {
              console.log(error.message);
            } else {
              console.log(results);
              return res.render("register.hbs", {
                message: `You have successfully registered`,
                category: "alert alert-primary text-center",
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.log(error.message);
  }
};

// Update - Form Autopopulation
exports.edit = (req, res) => {
  const email = req.params.email;

  db.query(
    "SELECT * FROM accounts WHERE email = ?",
    email,
    (error, result) => {
      console.log(result);

      res.render("accountUpdate.hbs", {
        account: result[0],
      });
    }
  );
};

// Update - Form Submission
exports.update = (req, res) => {
  const { first_name, last_name, email } = req.body;

  if (first_name === "" || last_name == "") {
    res.render("accountUpdate.hbs", {
      message: "First Name and Last Name should not be empty",
      category: "alert alert-danger text-center",
      account: {
        first_name,
        last_name,
        email,
      },
    });
  } else {
    db.query(
      `UPDATE accounts SET first_name = "${first_name}", last_name = "${last_name}" WHERE email = "${email}"`,
      (error, result) => {
        if (error) {
          console.log(error.message);
        } else {
          db.query(
            "SELECT * FROM accounts ORDER BY account_id",
            (error, results) => {
              res.render("accountsList.hbs", {
                header: "List of Users",
                data: results,
              });
            }
          );
        }
      }
    );
  }
};

// Delete - Selection
exports.delete = (req, res) => {
  const email = req.params.email;

  db.query(
    "SELECT * FROM accounts WHERE email = ?",
    email,
    (error, result) => {
      console.log(result);

      res.render("accountRemove.hbs", {
        account: result[0],
        message: "Are you sure you want to delete below account?",
        category: "alert alert-warning text-center",
      });
    }
  );
};

// Delete - Confirmation
exports.remove = (req, res) => {
  const { account_id, first_name, last_name, email } = req.body;

  db.query(
    "DELETE FROM accounts WHERE account_id = ?",
    account_id,
    (error, results) => {
      if (error) {
        console.log(error.message);
      } else {
        db.query(
          "SELECT * FROM accounts ORDER BY account_id",
          (error, results) => {
            res.render("accountsList.hbs", {
              header: "Updated List of Users",
              data: results,
            });
          }
        );
      }
    }
  );
};
//Logout
exports.logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(400).send("Unable to logout");
      } else {
        res.clearCookie("JWT");
        res.render("index.hbs", { message: "Successfully logged out" });
      }
    });
  } else {
    console.log("No session");
    res.end();
  }
};

// Skillset
exports.skillset = (req, res) => {
  const account_id = req.user.account_id;
  db.query(
    "SELECT title, level FROM skillset WHERE account_id = ?",
    account_id,
    (error, results) => {
      if (error) {
        console.log(error.message);
        return res.render("error.hbs"); // Handle error rendering appropriately
      }

      const userSkillset = results; // Assuming results is an array of skill objects with 'title' and 'level' properties

      res.render("skillset.hbs", { skillset: userSkillset });
    }
  );
};

