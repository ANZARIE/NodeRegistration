const express = require("express");
const router = express.Router();
const registerController = require("../controllers/validateAccount.js");

router.post("/signup", registerController.signup);

router.post("/signin", registerController.signin);

router.get("/edit/:email", registerController.edit);
router.post("/update", registerController.update);

router.get("/delete/:email", registerController.delete);
router.post("/remove", registerController.remove);

router.get("/logout", registerController.logout);

router.get("/skillset", registerController.skillset);

module.exports = router;
