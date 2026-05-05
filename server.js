const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
console.log(
    "ADMIN_KEY configured:",
    Boolean(process.env.ADMIN_KEY),
    process.env.ADMIN_KEY ? `(len=${String(process.env.ADMIN_KEY).length})` : ""
);
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/loginDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


/* ================= USER SCHEMA ================= */

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    role: { type: String, default: "user" },
    phone: String,
    membershipPlan: String,
    expiry: String,
    qrImage: String   // uploaded QR image path
});

const User = mongoose.model("User", userSchema);


/* ================= ATTENDANCE SCHEMA ================= */

const attendanceSchema = new mongoose.Schema({
    email: String,
    memberName: String,
    date: String,
    checkInTime: String,
    createdAt: { type: Date, default: Date.now }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

function normalizeEmail(email) {
    return String(email ?? "").trim().toLowerCase();
}

async function findUserByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    // Try normalized first (new behavior), then fallback to exact (legacy data)
    return (await User.findOne({ email: normalized })) || (await User.findOne({ email }));
}


/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "public/uploads";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });


/* ================= ADMIN CHECK ================= */

async function ensureAdmin(req, res, next) {
    const email = req.body.email || req.query.email;
    if (!email) return res.status(403).json({ success: false });

    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Not authorised" });
    }
    next();
}


/* ================= REGISTER ================= */

app.post("/register", async (req, res) => {
    try {
        const { fullname, email, password, confirmPassword, role, adminKey } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (password !== confirmPassword)
            return res.send("Passwords do not match");

        if (role === "admin") {
            const expectedAdminKey = String(process.env.ADMIN_KEY ?? "").trim();
            if (!expectedAdminKey) {
                return res
                    .status(500)
                    .send("Admin registration is disabled. Set ADMIN_KEY in your .env file and restart the server.");
            }

            const providedAdminKey = String(adminKey ?? "").trim();
            if (!providedAdminKey) {
                return res.status(400).send("Admin key is required");
            }
            if (providedAdminKey !== expectedAdminKey) {
                return res.status(401).send("Invalid Admin Key");
            }
        }

        const existing = await findUserByEmail(normalizedEmail);
        if (existing)
            return res.send("Email already registered");

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullname,
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "user"
        });

        await newUser.save();
        res.redirect("/login.html");

    } catch (err) {
        res.send("Error registering user: " + err.message);
    }
});


/* ================= LOGIN ================= */

app.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const user = await findUserByEmail(normalizedEmail);
        if (!user) return res.send("User not found");

        if (role && user.role !== role)
            return res.send("Incorrect role selected");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("Invalid Password");

        const safeUser = {
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            expiry: user.expiry || null
        };

        const redirect = user.role === "admin"
            ? "/dashboard.html"
            : "/home.html";

        res.send(`
            <script>
                localStorage.setItem("user", '${JSON.stringify(safeUser)}');
                window.location.href = "${redirect}";
            </script>
        `);

    } catch (err) {
        res.send("Login error");
    }
});


/* ================= ADMIN UPLOAD QR ================= */

app.post("/uploadQR", upload.single("qrImage"), async (req, res) => {
    try {
        const { memberEmail, adminEmail } = req.body;
        const memberEmailNorm = normalizeEmail(memberEmail);
        const adminEmailNorm = normalizeEmail(adminEmail);

        const admin = await findUserByEmail(adminEmailNorm);
        if (!admin || admin.role !== "admin") {
            return res.json({ success: false, message: "Not authorised" });
        }

        const user = await findUserByEmail(memberEmailNorm);
        if (!user) {
            return res.json({ success: false, message: "Member not found" });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: "QR image file is required" });
        }

        user.qrImage = "/uploads/" + req.file.filename;
        await user.save();

        res.json({ success: true, message: "QR uploaded successfully", qrImage: user.qrImage, memberEmail: user.email });

    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});


/* ================= GET MEMBER / USER QR ================= */

app.get("/getMemberQR", async (req, res) => {
    const email = req.query.email;
    const user = await findUserByEmail(email);

    if (!user || !user.qrImage) {
        return res.json({ success: false });
    }

    res.json({
        success: true,
        qrImage: user.qrImage
    });
});

app.get("/getUserQR", async (req, res) => {
    const email = req.query.email;
    if (!email) return res.json({ success: false });
    const user = await findUserByEmail(email);
    if (!user || !user.qrImage) {
        return res.json({ success: false });
    }
    res.json({ success: true, qrImage: user.qrImage });
});

/* ================= SCAN MEMBER QR ================= */

app.post("/scanMemberQR", async (req, res) => {
    try {
        const { scannedData } = req.body;

        const user = await User.findOne({ email: scannedData });
        if (!user) {
            return res.json({ success: false, message: "Invalid QR" });
        }

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const time = now.toLocaleTimeString();

        const existing = await Attendance.findOne({
            email: user.email,
            date: today
        });

        if (existing) {
            return res.json({ success: false, message: "Already marked today" });
        }

        await Attendance.create({
            email: user.email,
            memberName: user.fullname,
            date: today,
            checkInTime: time
        });

        res.json({
            success: true,
            message: "Attendance marked for " + user.fullname
        });

    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});


/* ================= MEMBERS API ================= */

app.get("/getMembers", async (req, res) => {
    try {
        const members = await User.find({ role: "user" })
            .select("-password")
            .lean();
        res.json({ success: true, members });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

function getExpiryFromPlan(plan) {
    const d = new Date();
    if (plan && plan.includes("yearly")) {
        d.setMonth(d.getMonth() + 12);
    } else if (plan && plan.includes("quarterly")) {
        d.setMonth(d.getMonth() + 3);
    } else {
        d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split("T")[0];
}

app.post("/addMember", async (req, res) => {
    try {
        const { fullname, email, phone, membershipPlan, password, adminEmail } = req.body;
        const normalizedEmail = normalizeEmail(email);
        if (!fullname || !email) {
            return res.status(400).json({ success: false, message: "Full name and email are required" });
        }
        if (!adminEmail) {
            return res.status(403).json({ success: false, message: "Please log in again as admin" });
        }
        const admin = await findUserByEmail(adminEmail);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised. Admin login required." });
        }
        const existing = await findUserByEmail(normalizedEmail);
        if (existing) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
        const hashedPassword = await bcrypt.hash(password || "Member@123", 10);
        const expiry = getExpiryFromPlan(membershipPlan);
        const newUser = new User({
            fullname,
            email: normalizedEmail,
            password: hashedPassword,
            role: "user",
            phone: phone || "",
            membershipPlan: membershipPlan || "",
            expiry
        });
        await newUser.save();
        res.json({ success: true, message: "Member added successfully" });
    } catch (err) {
        console.error("addMember error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= DASHBOARD STATS ================= */

app.get("/getDashboardStats", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const totalMembers = await User.countDocuments({ role: "user" });
        const todaysAttendance = await Attendance.countDocuments({ date: today });

        res.json({ totalMembers, todaysAttendance });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* ================= SERVER ================= */

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Gym app running on http://localhost:${PORT}`);
    });
}

module.exports = app;