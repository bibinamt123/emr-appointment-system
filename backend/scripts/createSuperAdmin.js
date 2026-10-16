
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const name = "System Administrator";
    const email = "admin@clinic.local";
    const password = "Admin@Clinic2026Secure";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("An account with this email already exists.");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    });

    console.log("Super Admin created successfully!");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Password:", password);
  } catch (error) {
    console.error("Error creating Super Admin:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin();
