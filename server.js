
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const allowedStatuses = [
    "New",
    "Contacted",
    "Qualified",
    "Lost"
];

const allowedSources = [
    "Website",
    "LinkedIn",
    "Referral",
    "Advertisement",
    "Other"
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate and normalize international phone numbers
function validatePhone(phone) {
    if (typeof phone !== "string" || !phone.trim()) {
        return null;
    }

    // Remove spaces, brackets, dots and hyphens
    const normalizedPhone = phone.replace(/[\s().-]/g, "");

    // Optional + followed by 7 to 15 digits
    const phonePattern = /^\+?[1-9]\d{6,14}$/;

    return phonePattern.test(normalizedPhone)
        ? normalizedPhone
        : null;
}

// Validate lead data
function validateLead(data) {
    const {
        name,
        email,
        phone,
        source,
        status
    } = data;

    if (
        typeof name !== "string" ||
        !name.trim()
    ) {
        return "Name is required";
    }

    if (name.trim().length > 100) {
        return "Name cannot exceed 100 characters";
    }

    if (
        typeof email !== "string" ||
        !email.trim()
    ) {
        return "Email is required";
    }

    if (!emailPattern.test(email.trim())) {
        return "Please enter a valid email address";
    }

    if (email.trim().length > 150) {
        return "Email cannot exceed 150 characters";
    }

    if (typeof phone !== "string" || !phone.trim()) {
        return "Phone number is required";
    }

    if (!validatePhone(phone)) {
        return "Enter a valid international phone number with 7 to 15 digits";
    }

    if (!allowedSources.includes(source)) {
        return "Please select a valid lead source";
    }

    if (!allowedStatuses.includes(status)) {
        return "Please select a valid lead status";
    }

    if (
        data.company !== undefined &&
        data.company !== null &&
        typeof data.company !== "string"
    ) {
        return "Invalid company name";
    }

    if (data.company && data.company.trim().length > 100) {
        return "Company name cannot exceed 100 characters";
    }

    return null;
}

// Home route
app.get("/", (req, res) => {
    res.send("Lead Manager API is running!");
});

// Dashboard statistics
app.get("/api/leads/stats", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'New') AS new_leads,
                COUNT(*) FILTER (WHERE status = 'Contacted') AS contacted,
                COUNT(*) FILTER (WHERE status = 'Qualified') AS qualified,
                COUNT(*) FILTER (WHERE status = 'Lost') AS lost
            FROM leads
        `);

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            error: "Failed to fetch dashboard statistics"
        });
    }
});

// Get, search and filter leads
app.get("/api/leads", async (req, res) => {
    try {
        const { search, status } = req.query;

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid lead status"
            });
        }

        let query = "SELECT * FROM leads WHERE 1=1";
        const values = [];

        if (search && search.trim()) {
            values.push(`%${search.trim()}%`);
            query += ` AND name ILIKE $${values.length}`;
        }

        if (status) {
            values.push(status);
            query += ` AND status = $${values.length}`;
        }

        query += " ORDER BY id ASC";

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            error: "Server error"
        });
    }
});

// Add a lead
app.post("/api/leads", async (req, res) => {
    try {
        const validationError = validateLead(req.body);

        if (validationError) {
            return res.status(400).json({
                error: validationError
            });
        }

        const {
            name,
            email,
            phone,
            company,
            source,
            status
        } = req.body;

        const result = await pool.query(
            `INSERT INTO leads
            (name, email, phone, company, source, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                name.trim(),
                email.trim(),
                validatePhone(phone),
                company ? company.trim() : null,
                source,
                status
            ]
        );

        res.status(201).json({
            message: "Lead created successfully",
            lead: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            error: "Failed to create lead"
        });
    }
});

// Update a lead
app.put("/api/leads/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid lead ID"
            });
        }

        const validationError = validateLead(req.body);

        if (validationError) {
            return res.status(400).json({
                error: validationError
            });
        }

        const {
            name,
            email,
            phone,
            company,
            source,
            status
        } = req.body;

        const result = await pool.query(
            `UPDATE leads
             SET name = $1,
                 email = $2,
                 phone = $3,
                 company = $4,
                 source = $5,
                 status = $6
             WHERE id = $7
             RETURNING *`,
            [
                name.trim(),
                email.trim(),
                validatePhone(phone),
                company ? company.trim() : null,
                source,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        res.json({
            message: "Lead updated successfully",
            lead: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            error: "Failed to update lead"
        });
    }
});

// Delete a lead
app.delete("/api/leads/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid lead ID"
            });
        }

        const result = await pool.query(
            "DELETE FROM leads WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        res.json({
            message: "Lead deleted successfully",
            lead: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            error: "Failed to delete lead"
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
