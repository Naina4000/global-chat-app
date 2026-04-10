const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ================= REGISTER USER ================= */

router.post("/register", async (req, res) => {

  try {

    const { username, email, password, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields"
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


/* ================= LOGIN USER ================= */

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      "mysecretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


/* ================= USER PROFILE ================= */

router.get("/profile", authMiddleware, async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


/* ================= SEARCH USERS ================= */

router.get("/search", authMiddleware, async (req, res) => {

  try {

    const keyword = req.query.search
      ? {
          username: { $regex: req.query.search, $options: "i" }
        }
      : {};

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user.id } })
      .select("username email profilePic");

    res.json(users);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


/* ================= GET ALL USERS ================= */
/* Useful later for admin / group chat */

router.get("/", authMiddleware, async (req, res) => {

  try {

    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("username email profilePic status");

    res.json(users);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


module.exports = router;


/* ================= GET CURRENT USER ================= */

router.get("/me", authMiddleware, async (req, res) => {
  try {

    const user = await require("../models/User")
      .findById(req.user.id)
      .select("-password");

    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE PROFILE ================= */

router.put("/update", authMiddleware, async (req, res) => {
  try {

    const { username, email, phone, profilePic } = req.body;

    const updatedUser = await require("../models/User")
      .findByIdAndUpdate(
        req.user.id,
        {
          username,
          email,
          phone,
          profilePic
        },
        { new: true }
      )
      .select("-password");

    res.json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed" });
  }
});
