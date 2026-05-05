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
// Initialize Resend with API Key only if available
let resend = null;
try {
    const ResendLib = require("resend").Resend;
    if (process.env.RESEND_API_KEY) {
        resend = new ResendLib(process.env.RESEND_API_KEY);
    }
} catch (e) {
    console.warn("Resend library failed to initialize:", e.message);
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect("/login.html");
});

const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/loginDB";
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to Cloud DB"))
    .catch(err => console.log(err));


/* ================= USER SCHEMA ================= */

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    role: { type: String, default: "user" },
    phone: String,
    gender: String,
    dob: String,
    height: String,
    weight: String,
    bloodGroup: String,
    membershipPlan: String,
    expiry: String,
    qrImage: String,
    qrBlocked: { type: Boolean, default: false },
    feesStatus: { type: String, default: "Pending" },
    lastPaymentDate: String,
    totalPaid: { type: Number, default: 0 },
    // Gamification
    points: { type: Number, default: 0 },
    badges: [{
        name: String,
        category: String,
        icon: String,
        dateEarned: { type: Date, default: Date.now }
    }],
    assignments: [{
        id: String,
        title: String,
        description: String,
        points: Number,
        status: { type: String, default: "Pending" }, // "Pending", "Completed"
        category: String,
        assignedDate: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model("User", userSchema);


/* ================= PAYMENT SCHEMA ================= */

const paymentSchema = new mongoose.Schema({
    email: String,
    memberName: String,
    amount: Number,
    date: { type: String, default: () => new Date().toISOString().split("T")[0] },
    method: String,
    plan: String,
    invoiceNo: String,
    status: { type: String, default: "Paid" }
});

const Payment = mongoose.model("Payment", paymentSchema);


/* ================= ADMIN CONFIG SCHEMA ================= */

const adminConfigSchema = new mongoose.Schema({
    adminPhone: String,
    upiQR: String
});

const AdminConfig = mongoose.model("AdminConfig", adminConfigSchema);


/* ================= ATTENDANCE SCHEMA ================= */

const attendanceSchema = new mongoose.Schema({
    email: String,
    memberName: String,
    date: String,
    checkInTime: String,
    checkOutTime: String,
    status: { type: String, default: "present" },
    createdAt: { type: Date, default: Date.now }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

/* ================= ANNOUNCEMENT SCHEMA ================= */

const announcementSchema = new mongoose.Schema({
    title: String,
    content: String,
    priority: String,
    target: String,
    expiry: String,
    createdAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.model("Announcement", announcementSchema);


/* ================= WORKOUT SCHEMA ================= */

const workoutSchema = new mongoose.Schema({
    memberEmail: { type: String, required: true },
    memberName: String,
    assignedBy: String,       // admin email
    date: { type: String, required: true },   // YYYY-MM-DD
    category: { type: String, default: "General" },
    workout: { type: String, required: true }, // typed workout text
    notes: String,
    // Completion tracking
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: null },  // admin email who marked it
    completionNote: { type: String, default: "" }, // optional admin note
    createdAt: { type: Date, default: Date.now }
});

const Workout = mongoose.model("Workout", workoutSchema);

/* ================= ANALYTICS TRACKING SCHEMAS ================= */

const workoutSessionSchema = new mongoose.Schema({
    email: String,
    date: { type: String, required: true },
    duration: { type: Number, default: 0 },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});
const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);

const exerciseLogSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutSession' },
    email: String,
    date: { type: String, required: true },
    muscleGroup: { type: String, default: 'General' },
    exerciseName: String,
    sets: Number,
    reps: Number,
    weight: Number,
    rpe: Number,
    estimated1RM: Number,  // Epley
    volumeLoad: Number,
    createdAt: { type: Date, default: Date.now }
});
const ExerciseLog = mongoose.model("ExerciseLog", exerciseLogSchema);

const personalRecordSchema = new mongoose.Schema({
    email: String,
    exerciseName: String,
    category: { type: String, default: 'Weight' }, // Max Weight
    weight: Number,
    reps: Number,
    date: String,
    createdAt: { type: Date, default: Date.now }
});
const PersonalRecord = mongoose.model("PersonalRecord", personalRecordSchema);
const volumeTrackingSchema = new mongoose.Schema({
    email: String,
    date: String,
    totalVolume: { type: Number, default: 0 },
    chestVolume: { type: Number, default: 0 },
    backVolume: { type: Number, default: 0 },
    legsVolume: { type: Number, default: 0 },
    shouldersVolume: { type: Number, default: 0 },
    armsVolume: { type: Number, default: 0 },
    coreVolume: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const VolumeTracking = mongoose.model("VolumeTracking", volumeTrackingSchema);









/* ================= ASSIGN WORKOUT ================= */

app.post("/assignWorkout", async (req, res) => {
    try {
        const { adminEmail, memberEmail, workout, date, category, notes } = req.body;

        if (!adminEmail || !memberEmail || !workout)
            return res.status(400).json({ success: false, message: "Admin email, member email and workout are required" });

        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin")
            return res.status(403).json({ success: false, message: "Not authorised" });

        const member = await User.findOne({ email: memberEmail });
        if (!member)
            return res.status(404).json({ success: false, message: "Member not found" });

        const workoutDate = date || new Date().toISOString().split("T")[0];

        // Replace existing workout for this member on this date (one workout per day per member)
        await Workout.findOneAndDelete({ memberEmail, date: workoutDate });

        const newWorkout = new Workout({
            memberEmail,
            memberName: member.fullname,
            assignedBy: adminEmail,
            date: workoutDate,
            category: category || "General",
            workout,
            notes: notes || ""
        });
        await newWorkout.save();

        res.json({ success: true, message: `Workout assigned to ${member.fullname} for ${workoutDate}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= ANALYTICS ENDPOINTS ================= */

app.post("/submitWorkoutSession", async (req, res) => {
    try {
        const { email, date, duration, notes, exercises } = req.body;
        if (!email || !exercises || !Array.isArray(exercises)) return res.status(400).json({ success: false, message: "Invalid payload format" });

        const session = await WorkoutSession.create({ email, date, duration, notes });

        let sessionVolume = 0;
        let vBreakdown = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0 };
        const prUpdates = [];
        const uniqueExercises = [...new Set(exercises.map(ex => ex.exerciseName))];

        for (let ex of exercises) {
            const w = Number(ex.weight) || 0;
            const r = Number(ex.reps) || 0;
            const s = Number(ex.sets) || 1;
            const est1RM = r > 0 ? (w * (1 + r / 30)) : 0;
            const vol = s * r * w;
            sessionVolume += vol;

            const m = (ex.muscleGroup || '').toLowerCase();
            if (m.includes('chest')) vBreakdown.chest += vol;
            else if (m.includes('back')) vBreakdown.back += vol;
            else if (m.includes('leg')) vBreakdown.legs += vol;
            else if (m.includes('shoulder')) vBreakdown.shoulders += vol;
            else if (m.includes('arm') || m.includes('bicep') || m.includes('tricep')) vBreakdown.arms += vol;
            else if (m.includes('core') || m.includes('abs')) vBreakdown.core += vol;

            await ExerciseLog.create({
                sessionId: session._id,
                email, date,
                muscleGroup: ex.muscleGroup || 'General',
                exerciseName: ex.exerciseName,
                sets: s, reps: r, weight: w,
                rpe: Number(ex.rpe) || null,
                estimated1RM: est1RM,
                volumeLoad: vol
            });

            // Check PR
            if (w > 0) {
                const existingPR = await PersonalRecord.findOne({ email, exerciseName: new RegExp('^' + ex.exerciseName + '$', 'i') });
                if (!existingPR) {
                    await PersonalRecord.create({ email, exerciseName: ex.exerciseName, weight: w, reps: r, date });
                    prUpdates.push({ exercise: ex.exerciseName, old: 0, new: w });
                } else if (w > existingPR.weight) {
                    prUpdates.push({ exercise: ex.exerciseName, old: existingPR.weight, new: w });
                    existingPR.weight = w;
                    existingPR.reps = r;
                    existingPR.date = date;
                    await existingPR.save();
                }
            }
        }

        const existingVol = await VolumeTracking.findOne({ email, date });
        if (existingVol) {
            existingVol.totalVolume += sessionVolume;
            existingVol.chestVolume += vBreakdown.chest;
            existingVol.backVolume += vBreakdown.back;
            existingVol.legsVolume += vBreakdown.legs;
            existingVol.shouldersVolume += vBreakdown.shoulders;
            existingVol.armsVolume += vBreakdown.arms;
            existingVol.coreVolume += vBreakdown.core;
            await existingVol.save();
        } else {
            await VolumeTracking.create({
                email, date,
                totalVolume: sessionVolume,
                chestVolume: vBreakdown.chest,
                backVolume: vBreakdown.back,
                legsVolume: vBreakdown.legs,
                shouldersVolume: vBreakdown.shoulders,
                armsVolume: vBreakdown.arms,
                coreVolume: vBreakdown.core
            });
        }

        let msg = "Workout logged successfully!";
        res.json({ success: true, message: msg, prUpdates, volume: sessionVolume });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getWorkoutAnalytics", async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ success: false, message: "Email missing" });

        const prs = await PersonalRecord.find({ email }).sort({ date: -1 }).lean();
        const volumes = await VolumeTracking.find({ email }).sort({ date: 1 }).lean();
        const rawExercises = await ExerciseLog.find({ email }).sort({ date: 1 }).lean();
        const sessions = await WorkoutSession.find({ email }).sort({ date: -1 }).limit(30).lean();

        let pie = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0 };
        volumes.forEach(v => {
            pie.chest += v.chestVolume || 0; pie.back += v.backVolume || 0;
            pie.legs += v.legsVolume || 0; pie.shoulders += v.shouldersVolume || 0;
            pie.arms += v.armsVolume || 0; pie.core += v.coreVolume || 0;
        });

        // 1RM grouping for line chart history
        const oneRMHistory = {};
        rawExercises.forEach(ex => {
            if (ex.estimated1RM > 0) {
                if (!oneRMHistory[ex.exerciseName]) oneRMHistory[ex.exerciseName] = [];
                oneRMHistory[ex.exerciseName].push({ x: ex.date, y: ex.estimated1RM });
            }
        });

        res.json({ success: true, prs, volumes, volumePie: pie, oneRMHistory, sessions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GET MY WORKOUTS (member view) ================= */

app.get("/getMyWorkouts", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const workouts = await Workout.find({ memberEmail: email })
            .sort({ date: -1 })
            .limit(30)
            .lean();

        res.json({ success: true, workouts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GET WORKOUT HISTORY (admin view) ================= */

app.get("/getWorkoutHistory", async (req, res) => {
    try {
        const { memberEmail } = req.query;
        const query = memberEmail ? { memberEmail } : {};
        const workouts = await Workout.find(query)
            .sort({ date: -1 })
            .limit(100)
            .lean();
        res.json({ success: true, workouts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= DELETE WORKOUT ================= */

app.delete("/deleteWorkout/:id", async (req, res) => {
    try {
        const adminEmail = req.query.adminEmail;
        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin")
            return res.status(403).json({ success: false, message: "Not authorised" });

        await Workout.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Workout deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= MARK WORKOUT COMPLETE ================= */

app.patch("/markWorkoutComplete/:id", async (req, res) => {
    try {
        const { adminEmail, completionNote } = req.body;

        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin")
            return res.status(403).json({ success: false, message: "Not authorised" });

        const w = await Workout.findById(req.params.id);
        if (!w)
            return res.status(404).json({ success: false, message: "Workout not found" });

        // Toggle completion
        w.completed = !w.completed;
        w.completedAt = w.completed ? new Date() : null;
        w.completedBy = w.completed ? adminEmail : null;
        w.completionNote = w.completed ? (completionNote || "") : "";
        await w.save();

        res.json({
            success: true,
            completed: w.completed,
            message: w.completed
                ? `Workout marked as completed for ${w.memberName || w.memberEmail}`
                : `Completion mark removed for ${w.memberName || w.memberEmail}`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= WORKOUT COMPLETION STATS (admin) ================= */

app.get("/getWorkoutCompletionStats", async (req, res) => {
    try {
        const adminEmail = req.query.adminEmail;
        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin")
            return res.status(403).json({ success: false, message: "Not authorised" });

        const stats = await Workout.aggregate([
            {
                $group: {
                    _id: "$memberEmail",
                    memberName: { $first: "$memberName" },
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: ["$completed", 1, 0] } }
                }
            },
            { $sort: { memberName: 1 } }
        ]);
        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


/* ================= MEMBER WORKOUT LOG SCHEMA ================= */

const memberWorkoutLogSchema = new mongoose.Schema({
    memberEmail: { type: String, required: true },
    date: { type: String, required: true },  // YYYY-MM-DD
    exercises: [{
        srNo: Number,
        bodyPart: String,
        exerciseName: String,
        sets: { type: Number, default: 0 },
        repetition: { type: Number, default: 0 },
        weight: { type: Number, default: 0 },
        rpe: { type: Number, default: null },
        status: { type: String, default: "In Progress" }  // "Completed" or "In Progress"
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Compound index: one log per member per day
memberWorkoutLogSchema.index({ memberEmail: 1, date: 1 }, { unique: true });

const MemberWorkoutLog = mongoose.model("MemberWorkoutLog", memberWorkoutLogSchema);

/* ---- Save / Update member workout log for a date ---- */

app.post("/saveMemberWorkoutLog", async (req, res) => {
    try {
        const { email, date, exercises } = req.body;
        if (!email || !date || !exercises)
            return res.status(400).json({ success: false, message: "Missing fields" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const prUpdates = [];
        let dailyVolume = 0;
        let vBreakdown = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0 };

        for (let ex of exercises) {
            const w = Number(ex.weight) || 0;
            const r = Number(ex.repetition) || 0;
            const s = Number(ex.sets) || 1;
            const vol = s * r * w;
            dailyVolume += vol;

            const m = (ex.bodyPart || '').toLowerCase();
            if (m.includes('chest')) vBreakdown.chest += vol;
            else if (m.includes('back')) vBreakdown.back += vol;
            else if (m.includes('leg')) vBreakdown.legs += vol;
            else if (m.includes('shoulder')) vBreakdown.shoulders += vol;
            else if (m.includes('bicep') || m.includes('tricep') || m.includes('arm')) vBreakdown.arms += vol;
            else if (m.includes('core') || m.includes('abs')) vBreakdown.core += vol;

            // Check PR
            if (w > 0) {
                const existingPR = await PersonalRecord.findOne({ email, exerciseName: new RegExp('^' + ex.exerciseName + '$', 'i') });
                if (!existingPR) {
                    await PersonalRecord.create({ email, exerciseName: ex.exerciseName, weight: w, reps: r, date });
                    prUpdates.push({ exercise: ex.exerciseName, old: 0, new: w });
                } else if (w > existingPR.weight) {
                    prUpdates.push({ exercise: ex.exerciseName, old: existingPR.weight, new: w });
                    existingPR.weight = w;
                    existingPR.reps = r;
                    existingPR.date = date;
                    await existingPR.save();
                }
            }
        }

        // Exact day Volume Rewrite:
        await VolumeTracking.findOneAndUpdate(
            { email, date },
            {
                totalVolume: dailyVolume,
                chestVolume: vBreakdown.chest,
                backVolume: vBreakdown.back,
                legsVolume: vBreakdown.legs,
                shouldersVolume: vBreakdown.shoulders,
                armsVolume: vBreakdown.arms,
                coreVolume: vBreakdown.core
            },
            { upsert: true }
        );

        // Recreate ExerciseLog documents for history analysis (so it saves estimated1RM).
        await ExerciseLog.deleteMany({ email, date });
        const exerciseDocs = exercises.map(ex => ({
            email, date,
            muscleGroup: ex.bodyPart || 'General',
            exerciseName: ex.exerciseName,
            sets: ex.sets, reps: ex.repetition, weight: Number(ex.weight) || 0,
            rpe: Number(ex.rpe) || null,
            estimated1RM: (Number(ex.repetition) || 0) > 0 ? ((Number(ex.weight) || 0) * (1 + (Number(ex.repetition) || 0) / 30)) : 0,
            volumeLoad: (Number(ex.sets) || 1) * (Number(ex.repetition) || 0) * (Number(ex.weight) || 0)
        }));
        if (exerciseDocs.length > 0) {
            await ExerciseLog.insertMany(exerciseDocs);
        }

        const log = await MemberWorkoutLog.findOneAndUpdate(
            { memberEmail: email, date },
            { exercises, updatedAt: new Date() },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        res.json({ success: true, message: "Workout log saved!", log, prUpdates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Get member workout log for a date ---- */

app.get("/getMemberWorkoutLog", async (req, res) => {
    try {
        const { email, date } = req.query;
        if (!email || !date)
            return res.status(400).json({ success: false, message: "Email and date required" });

        const log = await MemberWorkoutLog.findOne({ memberEmail: email, date }).lean();
        res.json({ success: true, log: log || null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ---- Clear member workout log for a date ---- */

app.delete("/clearMemberWorkoutLog", async (req, res) => {
    try {
        const { email, date } = req.query;
        if (!email || !date)
            return res.status(400).json({ success: false, message: "Email and date required" });

        await MemberWorkoutLog.findOneAndDelete({ memberEmail: email, date });
        res.json({ success: true, message: "Workout log cleared" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= OTP SCHEMA ================= */

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: { type: Date, default: Date.now, expires: 600 } // 10 minutes expiry
});

const Otp = mongoose.model("Otp", otpSchema);


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

        if (!fullname || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        const userEmail = email.toLowerCase();
        // Check if user already exists
        const existingUser = await User.findOne({ email: userEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        if (role === "admin") {
            const expectedAdminKey = String(process.env.ADMIN_KEY ?? "").trim();
            if (String(adminKey).trim() !== expectedAdminKey) {
                return res.status(403).json({ success: false, message: "Invalid Admin Key" });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            fullname,
            email: userEmail,
            password: hashedPassword,
            role: role || "user"
        });

        await newUser.save();

        const safeUser = {
            fullname: newUser.fullname,
            email: newUser.email,
            role: newUser.role
        };

        res.json({ success: true, message: "Account created successfully!", user: safeUser });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ success: false, message: "Error registering user: " + err.message });
    }
});




/* ================= LOGIN ================= */

app.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log("Login attempt for:", email, "Role:", role);

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (role && user.role !== role) {
            return res.status(403).json({ success: false, message: `Incorrect role selected. You are registered as a ${user.role}.` });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid Password" });
        }

        const safeUser = {
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            gender: user.gender || '',
            dob: user.dob || '',
            height: user.height || '',
            weight: user.weight || '',
            bloodGroup: user.bloodGroup || '',
            expiry: user.expiry || null
        };

        const redirect = user.role === "admin"
            ? "/dashboard.html"
            : "/home.html";

        res.json({
            success: true,
            user: safeUser,
            redirect: redirect
        });

    } catch (err) {
        console.error("Login route error:", err);
        res.status(500).json({ success: false, message: "Login error: " + err.message });
    }
});


/* ================= ADMIN UPLOAD QR ================= */

app.post("/uploadQR", upload.single("qrImage"), async (req, res) => {
    try {
        const { memberEmail, adminEmail } = req.body;

        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin") {
            return res.json({ success: false, message: "Not authorised" });
        }

        const user = await User.findOne({ email: memberEmail });
        if (!user) {
            return res.json({ success: false, message: "Member not found" });
        }

        user.qrImage = "/uploads/" + req.file.filename;
        await user.save();

        res.json({ success: true, message: "QR uploaded successfully" });

    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});


/* ================= GET MEMBER / USER QR ================= */

app.get("/getMemberQR", async (req, res) => {
    const email = req.query.email;

    const user = await User.findOne({ email });

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
    const user = await User.findOne({ email });
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
            return res.json({ success: false, message: "Invalid QR – member not found" });
        }

        // Check if QR is blocked by admin
        if (user.qrBlocked) {
            return res.json({
                success: false,
                message: "QR code is blocked by admin. Please contact the gym admin."
            });
        }

        // Check if membership has expired
        if (user.expiry) {
            const expiryDate = new Date(user.expiry);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expiryDate.setHours(23, 59, 59, 999); // Allow the full expiry day
            if (today > expiryDate) {
                return res.json({
                    success: false,
                    message: "Membership expired on " + user.expiry + ". Please renew to mark attendance."
                });
            }
        } else {
            // No expiry set – membership not activated yet
            return res.json({
                success: false,
                message: "No active membership found. Please contact admin."
            });
        }

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const time = now.toLocaleTimeString();

        const existing = await Attendance.findOne({
            email: user.email,
            date: todayStr
        });

        if (existing) {
            return res.json({ success: false, message: "Already marked today for " + user.fullname });
        }

        await Attendance.create({
            email: user.email,
            memberName: user.fullname,
            date: todayStr,
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

/* ================= MANUAL ATTENDANCE ================= */

app.post("/markAttendanceManual", async (req, res) => {
    try {
        const { email, date, checkInTime, checkOutTime, status } = req.body;
        if (!email || !date || !checkInTime) {
            return res.status(400).json({ success: false, message: "Email, Date, and Check-in time are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "Member not found" });

        const existing = await Attendance.findOne({ email, date });
        if (existing) {
            // Update existing record
            existing.checkOutTime = checkOutTime || existing.checkOutTime;
            existing.checkInTime = checkInTime;
            existing.status = status || existing.status;
            await existing.save();
            return res.json({ success: true, message: "Attendance updated for " + user.fullname });
        } else {
            // Create new record
            await Attendance.create({
                email,
                memberName: user.fullname,
                date,
                checkInTime,
                checkOutTime,
                status: status || "present"
            });
            return res.json({ success: true, message: "Attendance marked for " + user.fullname });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GET ATTENDANCE RECORDS ================= */
app.get("/attendanceRecords", async (req, res) => {
    try {
        const queryDate = req.query.date;
        const targetDate = queryDate ? queryDate : new Date().toISOString().split("T")[0];

        // Find target date's attendance records, sorted by _id desc (recent first) 
        const records = await Attendance.find({ date: targetDate })
            .sort({ _id: -1 })
            .lean();

        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GET USER ATTENDANCE ================= */
app.get("/getUserAttendance", async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.json({ success: false, message: "Email required" });

        // Get current year and month (YYYY-MM)
        const currentMonthPrefix = new Date().toISOString().slice(0, 7);

        // Find records for this user that start with the current YYYY-MM
        const records = await Attendance.find({
            email: email,
            date: { $regex: '^' + currentMonthPrefix }
        }).sort({ date: -1, _id: -1 }).lean();

        res.json({ success: true, records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= ANNOUNCEMENTS API ================= */

app.post("/addAnnouncement", async (req, res) => {
    try {
        const { title, content, priority, target, expiry } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required" });

        const announcement = new Announcement({
            title,
            content,
            priority: priority || "medium",
            target: target || "all",
            expiry
        });
        await announcement.save();
        res.json({ success: true, message: "Announcement created successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getAnnouncements", async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ _id: -1 }).lean();
        res.json({ success: true, announcements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= MEMBERS API ================= */

app.get("/getMembers", async (req, res) => {
    try {
        const members = await User.find({ role: "user" })
            .sort({ fullname: 1 })
            .select("-password")
            .lean();

        // compute streak
        const allAttendances = await Attendance.find().sort({ createdAt: 1 }).select("email date createdAt").lean();
        const attByEmail = {};
        for (let a of allAttendances) {
            if (!attByEmail[a.email]) attByEmail[a.email] = [];
            attByEmail[a.email].push(a);
        }

        const now = Date.now();
        const MAX_GAP = 36 * 3600000;

        members.forEach(member => {
            let streak = 0;
            const records = attByEmail[member.email] || [];

            if (records.length > 0) {
                let lastDate = null;
                let lastTime = 0;

                for (let c of records) {
                    if (streak === 0) {
                        streak = 1;
                        lastDate = c.date;
                        lastTime = new Date(c.createdAt).getTime();
                    } else {
                        if (c.date !== lastDate) {
                            const cTime = new Date(c.createdAt).getTime();
                            if (cTime - lastTime <= MAX_GAP) {
                                streak++;
                                lastDate = c.date;
                                lastTime = cTime;
                            } else {
                                streak = 1;
                                lastDate = c.date;
                                lastTime = cTime;
                            }
                        } else {
                            // same date, update the latest time for tomorrow's gap
                            lastTime = Math.max(lastTime, new Date(c.createdAt).getTime());
                        }
                    }
                }

                // Final expiration check against current time
                if (streak > 0 && (now - lastTime) > MAX_GAP) {
                    streak = 0;
                }
            }
            member.streak = streak;
        });

        res.json({ success: true, members });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ================= PAYMENTS API ================= */

app.post("/collectPayment", async (req, res) => {
    try {
        const { memberEmail, amount, method, plan } = req.body;
        const member = await User.findOne({ email: memberEmail });
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const invoiceNo = "INV-" + Date.now();
        const payment = new Payment({
            email: memberEmail,
            memberName: member.fullname,
            amount: Number(amount),
            method,
            plan,
            invoiceNo
        });
        await payment.save();

        member.feesStatus = "Paid";
        member.lastPaymentDate = new Date().toISOString().split("T")[0];
        member.totalPaid = (member.totalPaid || 0) + Number(amount);

        if (plan) {
            member.membershipPlan = plan;
            let durationMonths = 1;
            if (plan.includes("quarterly")) durationMonths = 3;
            if (plan.includes("yearly")) durationMonths = 12;

            let d = new Date();
            if (member.expiry && member.expiry !== '--') {
                const currentExpiry = new Date(member.expiry);
                if (currentExpiry > d) d = currentExpiry;
            }
            d.setMonth(d.getMonth() + durationMonths);
            member.expiry = d.toISOString().split("T")[0];
        }

        await member.save();

        // Send Automated Payment Email asynchronously
        try {
            resend.emails.send({
                from: "Gym App <onboarding@resend.dev>",
                to: member.email,
                subject: `Payment Successful - Invoice ${invoiceNo}`,
                html: `
                    <h2>Payment Received</h2>
                    <p>Hi ${member.fullname},</p>
                    <p>Thank you! Your payment of <strong>₹${Number(amount)}</strong> has been successfully received.</p>
                    <p><strong>Invoice Number:</strong> ${invoiceNo}</p>
                    <p><strong>Membership Plan:</strong> ${plan ? plan.replace(/_/g, ' ') : '--'}</p>
                    <p><strong>Payment Method:</strong> ${method}</p>
                    <p><strong>Expiry Date:</strong> ${member.expiry || '--'}</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p>Your Gym Admin</p>
                `
            }).catch(err => console.log('Failed to send invoice email:', err));
        } catch (mailError) {
            console.log('Error triggering mail sequence', mailError);
        }

        res.json({ success: true, message: "Payment recorded successfully", invoiceNo });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getPayments", async (req, res) => {
    try {
        const payments = await Payment.find().sort({ _id: -1 }).lean();
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getPaymentsByEmail", async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        const payments = await Payment.find({ email }).sort({ _id: -1 }).lean();
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getAdminConfig", async (req, res) => {
    try {
        let config = await AdminConfig.findOne();
        if (!config) {
            config = new AdminConfig({ adminPhone: "9999999999", upiQR: "" });
            await config.save();
        }
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/updateAdminConfig", upload.single("upiQR"), async (req, res) => {
    try {
        const { adminPhone } = req.body;
        let config = await AdminConfig.findOne();
        if (!config) config = new AdminConfig();

        if (adminPhone) config.adminPhone = adminPhone;
        if (req.file) config.upiQR = "/uploads/" + req.file.filename;

        await config.save();
        res.json({ success: true, message: "Admin config updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getPaymentsByEmail", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        const payments = await Payment.find({ email }).sort({ _id: -1 }).lean();
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/getUserInfo", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        const user = await User.findOne({ email }).select("-password").lean();
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const atts = await Attendance.find({ email }).sort({ createdAt: 1 }).select("date createdAt").lean();
        let streak = 0;

        if (atts.length > 0) {
            let lastDate = null;
            let lastTime = 0;
            const MAX_GAP = 36 * 3600000;

            for (let c of atts) {
                if (streak === 0) {
                    streak = 1;
                    lastDate = c.date;
                    lastTime = new Date(c.createdAt).getTime();
                } else {
                    if (c.date !== lastDate) {
                        const cTime = new Date(c.createdAt).getTime();
                        if (cTime - lastTime <= MAX_GAP) {
                            streak++;
                            lastDate = c.date;
                            lastTime = cTime;
                        } else {
                            streak = 1; // broken, restart from this date
                            lastDate = c.date;
                            lastTime = cTime;
                        }
                    } else {
                        lastTime = Math.max(lastTime, new Date(c.createdAt).getTime());
                    }
                }
            }
            // Check if expired as of right now
            if (streak > 0 && (Date.now() - lastTime) > MAX_GAP) {
                streak = 0;
            }
        }
        user.streak = streak;

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

function getExpiryFromPlan(plan) {
    if (!plan || plan === "--" || plan === "" || plan === undefined) {
        return "--";
    }
    const d = new Date();
    if (plan.includes("yearly")) {
        d.setMonth(d.getMonth() + 12);
    } else if (plan.includes("quarterly")) {
        d.setMonth(d.getMonth() + 3);
    } else {
        d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split("T")[0];
}

app.post("/addMember", async (req, res) => {
    try {
        const { fullname, email, phone, membershipPlan, password, adminEmail } = req.body;
        if (!fullname || !email) {
            return res.status(400).json({ success: false, message: "Full name and email are required" });
        }
        if (!adminEmail) {
            return res.status(403).json({ success: false, message: "Please log in again as admin" });
        }
        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised. Admin login required." });
        }
        const userEmail = email.toLowerCase();
        const existing = await User.findOne({ email: userEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password || "Member@123", 10);
        const expiry = getExpiryFromPlan(membershipPlan);
        
        const newUser = new User({
            fullname,
            email: userEmail,
            password: hashedPassword,
            role: "user",
            phone: phone || "",
            membershipPlan: membershipPlan || "",
            expiry
        });

        await newUser.save();

        res.json({ success: true, message: "Member added successfully!", member: { fullname, email: userEmail } });
    } catch (err) {
        console.error("addMember error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GENERATE QR ================= */
app.post("/generateQR", async (req, res) => {
    try {
        const { adminEmail, adminPassword, memberEmail, duration } = req.body;

        // Verify Admin
        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin") {
            return res.json({ success: false, message: "Admin not found or invalid role" });
        }
        const match = await bcrypt.compare(adminPassword, admin.password);
        if (!match) {
            return res.json({ success: false, message: "Invalid admin password" });
        }

        // Update Member Expiry
        const user = await User.findOne({ email: memberEmail });
        if (!user) {
            return res.json({ success: false, message: "Member not found" });
        }

        const d = new Date();
        d.setMonth(d.getMonth() + parseInt(duration || 1));
        user.expiry = d.toISOString().split("T")[0];
        await user.save();

        res.json({ success: true, message: "Verified and updated expiry" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= TOGGLE QR BLOCK ================= */
app.post("/toggleQRBlock", async (req, res) => {
    try {
        const { adminEmail, memberEmail } = req.body;
        if (!adminEmail || !memberEmail) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Verify admin
        const admin = await User.findOne({ email: adminEmail });
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }

        const member = await User.findOne({ email: memberEmail });
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        member.qrBlocked = !member.qrBlocked;
        await member.save();

        res.json({
            success: true,
            blocked: member.qrBlocked,
            message: member.qrBlocked
                ? `QR code blocked for ${member.fullname}`
                : `QR code unblocked for ${member.fullname}`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= SAVE GENERATED QR ================= */
app.post("/saveGeneratedQR", async (req, res) => {
    try {
        const { memberEmail, qrDataUrl } = req.body;
        if (!memberEmail || !qrDataUrl) {
            return res.json({ success: false, message: "Missing data" });
        }

        const user = await User.findOne({ email: memberEmail });
        if (!user) {
            return res.json({ success: false, message: "Member not found" });
        }

        // Extract base64 data from data URL
        const matches = qrDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
        if (!matches) {
            return res.json({ success: false, message: "Invalid image data" });
        }

        const ext = matches[1];
        const base64Data = matches[2];
        const fileName = `qr-${Date.now()}-${memberEmail.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
        const uploadDir = "public/uploads";

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        fs.writeFileSync(path.join(uploadDir, fileName), base64Data, "base64");

        user.qrImage = "/uploads/" + fileName;
        await user.save();

        res.json({ success: true, message: "QR saved to member profile" });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});


/* ================= PROFILE UPDATE ================= */

app.post("/updateProfile", async (req, res) => {
    try {
        const { email, fullname, phone, newEmail, gender, dob, height, weight, bloodGroup, requesterEmail } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });
        if (!requesterEmail) return res.status(400).json({ success: false, message: "Requester email is required" });

        // Authorization check: only the user themselves or an admin can update
        const requester = await User.findOne({ email: requesterEmail });
        if (!requester) return res.status(403).json({ success: false, message: "Not authorized" });

        const isOwner = requesterEmail === email;
        const isAdmin = requester.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Not authorized to update this profile" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Check if new email is already taken by another user
        if (newEmail && newEmail !== email) {
            const existingUser = await User.findOne({ email: newEmail });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already in use by another user" });
            }
            user.email = newEmail;
        }

        if (fullname) user.fullname = fullname;
        if (phone !== undefined) user.phone = phone;
        if (gender !== undefined) user.gender = gender;
        if (dob !== undefined) user.dob = dob;
        if (height !== undefined) user.height = height;
        if (weight !== undefined) user.weight = weight;
        if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully!",
            user: {
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                dob: user.dob,
                height: user.height,
                weight: user.weight,
                bloodGroup: user.bloodGroup
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= PASSWORD UPDATE ================= */

app.post("/updatePassword", async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        if (!email || !currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Missing required fields" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect current password" });

        // Update password directly
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GET USER NOTIFICATIONS ================= */

app.get("/getUserNotifications", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const notifications = [];
        const todayStr = new Date().toISOString().split("T")[0];
        const today = new Date();

        // 1. Expiring membership
        if (user.expiry && user.expiry !== '--') {
            const expiryDate = new Date(user.expiry);
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7 && diffDays >= 0) {
                notifications.push({
                    title: "Membership Expiring Soon",
                    message: `Your membership expires in ${diffDays} day(s) on ${user.expiry}.`,
                    type: "warning",
                    date: todayStr
                });
            } else if (diffDays < 0) {
                notifications.push({
                    title: "Membership Expired",
                    message: `Your membership expired on ${user.expiry}. Please renew.`,
                    type: "danger",
                    date: todayStr
                });
            }
        }

        // 2. Not attending todays GYM workout
        const attendanceToday = await Attendance.findOne({ email, date: todayStr });
        if (!attendanceToday) {
            notifications.push({
                title: "Missed Workout?",
                message: "You haven't marked your attendance for today's workout yet.",
                type: "info",
                date: todayStr
            });
        }

        // 3. New membership started
        if (user.lastPaymentDate) {
            const lastPayment = new Date(user.lastPaymentDate);
            const diffTime = today - lastPayment;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7 && diffDays >= 0) {
                notifications.push({
                    title: "New Membership Started",
                    message: `Your new membership plan (${user.membershipPlan || 'Active'}) has started!`,
                    type: "success",
                    date: user.lastPaymentDate
                });
            }
        }

        // 4. Announcements by admin
        const announcements = await Announcement.find({
            $or: [
                { expiry: { $exists: false } },
                { expiry: null },
                { expiry: "" },
                { expiry: { $gte: todayStr } }
            ]
        }).sort({ _id: -1 }).lean();

        for (const ann of announcements) {
            notifications.push({
                title: "Announcement: " + ann.title,
                message: ann.content,
                type: ann.priority === "high" ? "danger" : (ann.priority === "low" ? "info" : "primary"),
                date: ann.createdAt ? new Date(ann.createdAt).toISOString().split("T")[0] : todayStr
            });
        }

        res.json({ success: true, notifications });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


/* ================= WORKOUT PROGRESS TRACKER ================= */

/* ================= BADGE & ACHIEVEMENT LOGIC ================= */

const BADGE_DEFINITIONS = [
    // Consistency
    { id: "streak_7", name: "7-Day Streak", category: "Consistency", icon: "🔥", points: 50 },
    { id: "warrior_100", name: "Workout Warrior", category: "Consistency", icon: "📅", points: 200 },
    { id: "night_owl", name: "Night Owl", category: "Consistency", icon: "🌙", points: 30 },
    // Strength
    { id: "plate_picker", name: "Plate Picker", category: "Strength", icon: "💪", points: 40 },
    { id: "bw_champion", name: "Bodyweight Champion", category: "Strength", icon: "🏋️", points: 150 },
    { id: "1000lb_club", name: "1000lb Club", category: "Strength", icon: "🔱", points: 500 },
    // Volume
    { id: "vol_victim", name: "Volume Victim", category: "Volume", icon: "📊", points: 100 },
    { id: "vol_10k", name: "10k Club", category: "Volume", icon: "⚡", points: 250 },
    { id: "factory_worker", name: "Factory Worker", category: "Volume", icon: "🏭", points: 500 },
    // Milestones
    { id: "pr_breaker", name: "PR Breaker", category: "Milestones", icon: "🎯", points: 80 },
    { id: "time_keeper", name: "Time Keeper", category: "Milestones", icon: "⏱️", points: 30 },
    { id: "comeback_king", name: "Comeback King", category: "Milestones", icon: "🔄", points: 100 },
];

async function checkAndAwardBadges(user, allLogs, prs, attendance) {
    let earnedNew = false;
    const currentBadges = user.badges.map(b => b.name);
    let totalPoints = user.points || 0;

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. 7-Day Streak
    if (!currentBadges.includes("7-Day Streak")) {
        const dates = [...new Set(allLogs.map(l => l.date))].sort();
        let streak = 0;
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) streak = 1;
            else {
                const prev = new Date(dates[i - 1]);
                const curr = new Date(dates[i]);
                const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                if (diff === 1) streak++;
                else streak = 1;
            }
            if (streak >= 7) {
                user.badges.push({ name: "7-Day Streak", category: "Consistency", icon: "🔥" });
                totalPoints += 50;
                earnedNew = true;
                break;
            }
        }
    }

    // 2. Workout Warrior (100 total)
    if (!currentBadges.includes("Workout Warrior") && allLogs.length >= 100) {
        user.badges.push({ name: "Workout Warrior", category: "Consistency", icon: "📅" });
        totalPoints += 200;
        earnedNew = true;
    }

    // 3. Plate Picker (Weight >= 20kg)
    if (!currentBadges.includes("Plate Picker")) {
        const hasPlate = allLogs.some(l => (l.exercises || []).some(ex => (Number(ex.weight) || 0) >= 20));
        if (hasPlate) {
            user.badges.push({ name: "Plate Picker", category: "Strength", icon: "💪" });
            totalPoints += 40;
            earnedNew = true;
        }
    }

    // 4. Volume Milestones
    const totalVol = await VolumeTracking.aggregate([
        { $match: { email: user.email } },
        { $group: { _id: null, total: { $sum: "$totalVolume" } } }
    ]);
    const vol = (totalVol[0] && totalVol[0].total) || 0;

    if (!currentBadges.includes("Volume Victim") && vol >= 10000) {
        user.badges.push({ name: "Volume Victim", category: "Volume", icon: "📊" });
        totalPoints += 100; earnedNew = true;
    }
    if (!currentBadges.includes("10k Club") && vol >= 50000) {
        user.badges.push({ name: "10k Club", category: "Volume", icon: "⚡" });
        totalPoints += 250; earnedNew = true;
    }
    if (!currentBadges.includes("Factory Worker") && vol >= 100000) {
        user.badges.push({ name: "Factory Worker", category: "Volume", icon: "🏭" });
        totalPoints += 500; earnedNew = true;
    }

    // 5. Strength Milestones
    if (!currentBadges.includes("Bodyweight Champion")) {
        const benchPR = prs.find(p => p.exerciseName.toLowerCase().includes("bench press"));
        if (benchPR && benchPR.weight >= (Number(user.weight) || 100)) {
            user.badges.push({ name: "Bodyweight Champion", category: "Strength", icon: "🏋️" });
            totalPoints += 150; earnedNew = true;
        }
    }
    if (!currentBadges.includes("1000lb Club")) {
        const squat = prs.find(p => p.exerciseName.toLowerCase().includes("squat"))?.weight || 0;
        const bench = prs.find(p => p.exerciseName.toLowerCase().includes("bench press"))?.weight || 0;
        const deadlift = prs.find(p => p.exerciseName.toLowerCase().includes("deadlift"))?.weight || 0;
        const totalKg = squat + bench + deadlift;
        if (totalKg >= 453.5) { // 1000 lbs in kg
            user.badges.push({ name: "1000lb Club", category: "Strength", icon: "🔱" });
            totalPoints += 500; earnedNew = true;
        }
    }

    // 6. Time Keeper (6 AM Workout)
    if (!currentBadges.includes("Time Keeper")) {
        const hasEarly = attendance.some(a => a.checkInTime && a.checkInTime.startsWith("06:"));
        if (hasEarly) {
            user.badges.push({ name: "Time Keeper", category: "Milestones", icon: "⏱️" });
            totalPoints += 30; earnedNew = true;
        }
    }

    // 7. Night Owl (Late Night)
    if (!currentBadges.includes("Night Owl")) {
        const hasLate = attendance.some(a => {
            if (!a.checkInTime) return false;
            const hour = parseInt(a.checkInTime.split(":")[0]);
            return hour >= 21 || hour <= 4;
        });
        if (hasLate) {
            user.badges.push({ name: "Night Owl", category: "Consistency", icon: "🌙" });
            totalPoints += 30; earnedNew = true;
        }
    }

    if (earnedNew) {
        user.points = totalPoints;
        await user.save();
    }
    return earnedNew;
}

const DEFAULT_ASSIGNMENTS = [
    { title: "Volume Surge", description: "Complete 5,000kg total volume in a single session", points: 100, category: "Volume" },
    { title: "Consistency King", description: "Log workouts 4 days this week", points: 80, category: "Consistency" },
    { title: "PR Hunter", description: "Set a new Personal Record in any exercise", points: 150, category: "Strength" },
    { title: "Muscle Focus", description: "Target 4 different body parts in one workout", points: 60, category: "Variety" }
];

/* ================= COMPLETE ASSIGNMENT ================= */

app.post("/completeAssignment", async (req, res) => {
    try {
        const { email, assignmentId } = req.body;
        if (!email || !assignmentId) return res.status(400).json({ success: false, message: "Email and assignment ID required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const asgn = user.assignments.find(a => a.id === assignmentId);
        if (!asgn) return res.status(404).json({ success: false, message: "Assignment not found" });

        if (asgn.status === "Completed") return res.json({ success: false, message: "Already completed" });

        asgn.status = "Completed";
        user.points = (user.points || 0) + (asgn.points || 0);

        await user.save();
        res.json({ success: true, message: `Assignment completed! +${asgn.points} points awarded.`, points: user.points });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= WORKOUT PROGRESS TRACKER ================= */

app.get("/getWorkoutProgress", async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // ── Date ranges ──
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split("T")[0];

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().split("T")[0];

        const monthStartStr = todayStr.slice(0, 7) + "-01";
        const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthEndStr = monthEndDate.toISOString().split("T")[0];

        // Last Month Record
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStartStr = lastMonthDate.toISOString().split("T")[0];
        const lastMonthEndStr = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

        // ── Fetch Data ──
        const allLogs = await MemberWorkoutLog.find({ memberEmail: email }).sort({ date: 1 }).lean();
        const prs = await PersonalRecord.find({ email }).lean();
        const attendance = await Attendance.find({ email }).lean();

        // Check/Update Badges
        await checkAndAwardBadges(user, allLogs, prs, attendance);

        // ── Calculations ──
        const weekLogs = allLogs.filter(l => l.date >= weekStartStr && l.date <= weekEndStr);
        const monthLogs = allLogs.filter(l => l.date >= monthStartStr && l.date <= monthEndStr);
        const lastMonthLogs = allLogs.filter(l => l.date >= lastMonthStartStr && l.date <= lastMonthEndStr);

        // Past Month Achievements
        const lastMonthStats = {
            workouts: lastMonthLogs.length,
            prs: prs.filter(p => p.date >= lastMonthStartStr && p.date <= lastMonthEndStr).length,
            volume: 0
        };
        const lastMonthVolumes = await VolumeTracking.find({ email, date: { $gte: lastMonthStartStr, $lte: lastMonthEndStr } });
        lastMonthStats.volume = lastMonthVolumes.reduce((acc, v) => acc + (v.totalVolume || 0), 0);

        // Weekly Trends, Body Part Breakdown etc.
        const bodyPartCount = {};
        const bodyPartVolume = {};
        monthLogs.forEach(log => {
            (log.exercises || []).forEach(ex => {
                const bp = ex.bodyPart || "Other";
                bodyPartCount[bp] = (bodyPartCount[bp] || 0) + 1;
                const vol = (Number(ex.sets) || 1) * (Number(ex.repetition) || 0) * (Number(ex.weight) || 0);
                bodyPartVolume[bp] = (bodyPartVolume[bp] || 0) + vol;
            });
        });

        const weeklyTrend = [];
        for (let i = 11; i >= 0; i--) {
            const wStart = new Date(weekStart);
            wStart.setDate(wStart.getDate() - (i * 7));
            const wStartStr = wStart.toISOString().split("T")[0];
            const wEndStr = new Date(wStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            const count = allLogs.filter(l => l.date >= wStartStr && l.date <= wEndStr).length;
            const label = wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            weeklyTrend.push({ label, count });
        }

        const dailyLog = {};
        monthLogs.forEach(log => {
            const completed = (log.exercises || []).filter(e => e.status === "Completed").length;
            const total = (log.exercises || []).length;
            dailyLog[log.date] = { completed, total };
        });

        // Best Streak Calculation (All time)
        const allDates = [...new Set(allLogs.map(l => l.date))].sort();
        let currentStreak = 0;
        let bestStreakAllTime = 0;
        for (let i = 0; i < allDates.length; i++) {
            if (i === 0) currentStreak = 1;
            else {
                const prev = new Date(allDates[i - 1]);
                const curr = new Date(allDates[i]);
                const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
                if (diff === 1) currentStreak++;
                else currentStreak = 1;
            }
            if (currentStreak > bestStreakAllTime) bestStreakAllTime = currentStreak;
        }

        // Assignments Logic
        if (!user.assignments || user.assignments.length === 0) {
            user.assignments = DEFAULT_ASSIGNMENTS.map((a, i) => ({
                id: "asgn_" + Date.now() + "_" + i,
                ...a,
                status: "Pending"
            }));
            await user.save();
        }

        res.json({
            success: true,
            user: {
                points: user.points || 0,
                badges: user.badges || [],
                assignments: user.assignments || []
            },
            weekWorkoutCount: weekLogs.length,
            monthWorkoutCount: monthLogs.length,
            totalWorkouts: allLogs.length,
            bodyPartCount,
            bodyPartVolume,
            weeklyTrend,
            dailyLog,
            bestStreak: bestStreakAllTime,
            lastMonthStats,
            weekRange: { start: weekStartStr, end: weekEndStr },
            monthRange: { start: monthStartStr, end: monthEndStr }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= GET USER QR ================= */

app.get("/getUserQR", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.json({ success: false, message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "User not found" });

        const qrContent = user.email;
        res.json({ success: true, qrCode: qrContent, qrImage: user.qrImage });
    } catch (err) {
        res.json({ success: false, message: err.message });
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