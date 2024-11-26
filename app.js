const express = require("express");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

// Initialize the app
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Set the view engine to EJS
app.set("view engine", "ejs");

// PostgreSQL connection using pg Pool
const pool = new Pool({
  user: process.env.PGUSER || "your_pg_username",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "patient_intake",
  password: process.env.PGPASSWORD || "your_pg_password",
  port: process.env.PGPORT || 5432,
});

pool.connect((err) => {
  if (err) {
    console.error("PostgreSQL connection error", err);
  } else {
    console.log("Connected to PostgreSQL");
  }
});

// File upload configuration using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Routes

// Welcome Screen Route
app.get("/", (req, res) => {
  res.render("welcome");
});

// Intake form GET route
app.get("/intake", async (req, res) => {
  try {
    let { patientId } = req.query;
    let patientData = null;

    if (!patientId) {
      const result = await pool.query(
        "INSERT INTO patients (first_name, middle_name, last_name) VALUES (NULL, NULL, NULL) RETURNING id"
      );
      patientId = result.rows[0].id;
      patientData = {};
    } else {
      const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
      patientData = result.rows[0];
      if (!patientData) {
        return res.status(404).send("Patient not found");
      }
    }

    res.render("intake", { patient: patientData, patientId });
  } catch (error) {
    console.error("Error in /intake route:", error);
    res.status(500).send("Error loading patient record");
  }
});

// POST route for intake form
app.post("/intake", async (req, res) => {
  try {
    const { patientId, firstName, middleName, lastName, mobile, email, address } = req.body;

    await pool.query(
      "UPDATE patients SET first_name = $1, middle_name = $2, last_name = $3, mobile = $4, email = $5, address = $6 WHERE id = $7",
      [firstName, middleName, lastName, mobile, email, address, patientId]
    );

    res.redirect(`/health-questions?patientId=${patientId}`);
  } catch (error) {
    console.error("Error saving patient record:", error);
    res.status(500).send("Error saving patient record");
  }
});

// Health Questions GET route
app.get("/health-questions", async (req, res) => {
  try {
    const { patientId } = req.query;

    const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
    const patient = result.rows[0];
    console.log("Loaded", patientData)


    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    res.render("health_questions", { patient, patientId });
  } catch (error) {
    console.error("Error loading health questions:", error);
    res.status(500).send("Error loading patient data");
  }
});

// POST route for health questions
app.post("/health-questions", async (req, res) => {
  try {
    const { patientId, grayHair, brokenBone, tripOver } = req.body;

    await pool.query(
      "UPDATE patients SET gray_hair = $1, broken_bone = $2, trip_over = $3 WHERE id = $4",
      [grayHair === "Yes", brokenBone === "Yes", tripOver === "Yes", patientId]
    );

    res.redirect(`/insurance?patientId=${patientId}`);
  } catch (error) {
    console.error("Error updating health questions:", error);
    res.status(500).send("Error updating health questions");
  }
});

// GET route for insurance details
app.get("/insurance", async (req, res) => {
  try {
    const { patientId } = req.query;

    const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
    const patient = result.rows[0];

    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    res.render("insurance", { patient, patientId });
  } catch (error) {
    console.error("Error loading insurance form:", error);
    res.status(500).send("Error loading insurance form");
  }
});

// POST route for insurance details
app.post("/insurance", async (req, res) => {
  try {
    const { patientId, carrier, policy } = req.body;

    await pool.query(
      "UPDATE patients SET insurance_carrier = $1, policy_number = $2 WHERE id = $3",
      [carrier, policy, patientId]
    );

    res.redirect(`/upload-insurance?patientId=${patientId}`);
  } catch (error) {
    console.error("Error updating insurance details:", error);
    res.status(500).send("Error updating insurance details");
  }
});

// Upload Insurance GET route
app.get("/upload-insurance", async (req, res) => {
  try {
    const { patientId } = req.query;

    const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
    const patient = result.rows[0];

    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    res.render("upload_insurance", { patient, patientId });
  } catch (error) {
    console.error("Error loading upload insurance form:", error);
    res.status(500).send("Error loading upload insurance form");
  }
});

// POST route for uploading insurance card
app.post("/upload-insurance", upload.single("insuranceCard"), async (req, res) => {
  try {
    const { patientId } = req.body;
    const imgData = fs.readFileSync(req.file.path);

    await pool.query("UPDATE patients SET insurance_card = $1, insurance_card_uploaded = TRUE WHERE id = $2", [
      imgData,
      patientId,
    ]);

    res.redirect(`/schedule?patientId=${patientId}`);
  } catch (error) {
    console.error("Error uploading insurance card:", error);
    res.status(500).send("Error uploading insurance card");
  }
});

// Schedule Appointment GET route
app.get("/schedule", async (req, res) => {
  try {
    const { patientId } = req.query;

    const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
    const patient = result.rows[0];
    console.log("loaded", patient)
    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    const appointmentTime = patient.appointment_time || "";
    const appointmentDate = patient.appointment_date || "";

    res.render("schedule", {
      patient,
      patientId,
      appointmentTime,
      appointmentDate,
    });
  } catch (error) {
    console.error("Error in /schedule route:", error);
    res.status(500).send("Error loading schedule page");
  }
});

// POST route for schedule appointment
app.post("/schedule", async (req, res) => {
  const { patientId, appointmentTime, appointmentDate } = req.body;

  try {
    await pool.query(
      "UPDATE patients SET appointment_time = $1, appointment_date = $2 WHERE id = $3",
      [appointmentTime, appointmentDate, patientId]
    );

    res.redirect(`/tos?patientId=${patientId}`);
  } catch (error) {
    console.error("Error saving appointment:", error);
    res.status(500).send("Error saving appointment");
  }
});

// Terms of Service GET route
app.get("/tos", async (req, res) => {
  try {
    const { patientId } = req.query;
    res.render("tos", { patientId });
  } catch (error) {
    console.error("Error in /tos route:", error);
    res.status(500).send("Error loading Terms of Service page");
  }
});

// Success Page Route
app.get("/form-submitted", (req, res) => {
  res.render("form_submitted");
});

app.post("/tos", (req, res) => {
  if (req.body.tos) {
    res.redirect("/form-submitted");
  } else {
    res.send("Please accept the Terms of Service.");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
