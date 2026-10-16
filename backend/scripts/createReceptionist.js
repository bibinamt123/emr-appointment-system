require("dotenv").config({ path: "backend/.env" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createReceptionist() {
  try {
    const name = (await ask("Receptionist name: ")).trim();
    const email = (await ask("Receptionist email: "))
      .trim()
      .toLowerCase();
    const password = await ask("Receptionist password (minimum 8 characters): ");

    if (!name || !email || password.length < 8) {
      throw new Error(
        "Name and email are required; password must be at least 8 characters."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(
        `An account already exists with this email and role ${existingUser.role}.`
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const receptionist = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "RECEPTIONIST",
      isActive: true,
    });

    console.log("Receptionist created successfully.");
    console.log("Email:", receptionist.email);
    console.log("Role:", receptionist.role);
  } catch (error) {
    console.error("Could not create receptionist:", error.message);
  } finally {
    rl.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

createReceptionist();
