// ============================================
// GYM MANAGEMENT APP - BACKEND SERVER
// Node.js + Express + MongoDB
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Diagnostic: Log the build path and verify file existence
const fs = require('fs');
const buildPath = path.resolve(__dirname, '../frontend/build');
console.log(`\n--- [RENDER DEBUG] ---`);
console.log(`Current __dirname: ${__dirname}`);
console.log(`Target buildPath:  ${buildPath}`);
console.log(`Build path exists? ${fs.existsSync(buildPath)}`);
if (fs.existsSync(buildPath)) {
  console.log(`index.html exists? ${fs.existsSync(path.join(buildPath, 'index.html'))}`);
}
console.log(`----------------------\n`);

// Serve static files from the React frontend app
app.use(express.static(buildPath));

const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  process.env.FRONTEND_URL // Add your deployed frontend URL here
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ============================================
// EMAIL SERVICE
// ============================================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER || 'mock@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

const sendVerificationEmail = async (email, token, name, type = 'owner') => {
  const verificationUrl = `http://localhost:3000/verify/${token}`;
  
  // LOG THE LINK FOR CONSOLE TESTING
  console.log(`\n📧 EMAIL SIMULATION [${type}]`);
  console.log(`To: ${email}`);
  console.log(`Link: ${verificationUrl}\n`);

  try {
    await transporter.sendMail({
      from: '"GYM PRO" <noreply@gympro.com>',
      to: email,
      subject: "Verify your GYM PRO account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">Welcome to GYM PRO, ${name}!</h2>
          <p>Please click the button below to verify your email address and activate your account:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link: <br> ${verificationUrl}</p>
          <hr>
          <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('❌ Email failed to send:', err.message);
  }
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET || 'gym-app-secret-key-2024', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/gym-app');
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error) {
    console.log('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ============================================
// DATABASE SCHEMAS
// ============================================

// GYM OWNER SCHEMA
const gymOwnerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  gymName: String,
  password: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  createdAt: { type: Date, default: Date.now }
});

// MEMBER SCHEMA
const memberSchema = new mongoose.Schema({
  gymId: mongoose.Schema.Types.ObjectId,
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: { type: String, default: 'gym123' }, // Default password for members
  joiningDate: { type: Date, default: Date.now },
  membershipType: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
  monthlyFees: Number,
  gymName: String, // Store gym name for members
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  createdAt: { type: Date, default: Date.now }
});

// ATTENDANCE SCHEMA
const attendanceSchema = new mongoose.Schema({
  memberId: mongoose.Schema.Types.ObjectId,
  checkInTime: Date,
  checkOutTime: Date,
  date: { type: Date, default: Date.now },
  duration: Number // in minutes
});

// FEES SCHEMA
const feesSchema = new mongoose.Schema({
  memberId: mongoose.Schema.Types.ObjectId,
  gymId: mongoose.Schema.Types.ObjectId,
  amountDue: Number,
  dueDate: Date,
  paymentDate: Date,
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paymentMethod: String,
  month: Number,
  year: Number,
  createdAt: { type: Date, default: Date.now }
});

// MODELS
const GymOwner = mongoose.model('GymOwner', gymOwnerSchema);
const Member = mongoose.model('Member', memberSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Fees = mongoose.model('Fees', feesSchema);

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// REGISTER GYM OWNER (ADMIN ONLY)
app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, gymName, password, role } = req.body;
    const requesterRole = req.user?.role;

    // THE ONLY WAY TO REGISTER AN OWNER IS BY THE ADMIN
    if (requesterRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admin can register new Gym Owners.' });
    }

    const existingOwner = await GymOwner.findOne({ $or: [{ email }, { phone }] });
    if (existingOwner) {
      const field = existingOwner.email === email ? 'Email' : 'Phone number';
      return res.status(400).json({ success: false, message: `${field} already registered` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newOwner = new GymOwner({
      name, email, phone, gymName,
      password: hashedPassword,
      verificationToken
    });

    await newOwner.save();
    
    // Send email (async)
    sendVerificationEmail(email, verificationToken, name, 'owner');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification.',
      id: newOwner._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// EMAIL VERIFICATION
app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Check Owners
    let user = await GymOwner.findOneAndUpdate(
      { verificationToken: token },
      { isVerified: true, verificationToken: null },
      { new: true }
    );

    // If not owner, check Members
    if (!user) {
      user = await Member.findOneAndUpdate(
        { verificationToken: token },
        { isVerified: true, verificationToken: null },
        { new: true }
      );
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    res.json({ success: true, message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LOGIN (OWNER OR MEMBER)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user;
    let userRole = role || 'owner';

    // Check for System Admin
    if (email === 'leelaramtrt1@gmail.com' && password === 'Ram@0201') {
      user = await GymOwner.findOne({ email: 'leelaramtrt1@gmail.com' });
      if (!user) {
        console.log('Creating missing Admin account...');
        const hashedPassword = await bcrypt.hash('Ram@0201', 10);
        user = new GymOwner({
          name: 'SUPER ADMIN',
          email: 'leelaramtrt1@gmail.com',
          password: hashedPassword,
          gymName: 'SYSTEM ADMIN',
          isVerified: true
        });
        await user.save();
      }
      userRole = 'admin';
    } else {
      // Try GymOwner first
      user = await GymOwner.findOne({ email });
      if (user) {
        userRole = 'owner';
      } else {
        // Try Member
        user = await Member.findOne({ email });
        if (user) {
          userRole = 'member';
        }
      }
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
       // Allow login but maybe mark as unverified in frontend
       // Or strictly block:
       // return res.status(403).json({ success: false, message: 'Please verify your email first.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || 'gym123'); // Support default member pass
    if (!isPasswordValid && password !== 'gym123') { // Simple fallback for member default
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: userRole },
      process.env.JWT_SECRET || 'gym-app-secret-key-2024',
      { expiresIn: '30d' }
    );

    const response = {
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        gymName: user.gymName || (userRole === 'admin' ? 'SYSTEM ADMIN' : ''),
        isVerified: user.isVerified
      }
    };
    
    console.log(`[LOGIN SUCCESS] ${email} as ${userRole}`);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LIST ALL OWNERS (ADMIN ONLY)
app.get('/api/admin/owners', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admin can access this list.' });
    }
    const owners = await GymOwner.find({ email: { $ne: 'leelaramtrt1@gmail.com' } });
    res.json({ success: true, owners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE OWNER (ADMIN ONLY)
app.delete('/api/admin/owner/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });
    await GymOwner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Owner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// MEMBER ROUTES (PROTECTED)
// ============================================

// ADD NEW MEMBER
app.post('/api/members/add', authenticateToken, async (req, res) => {
  try {
    const { gymId, name, email, phone, joiningDate, membershipType, monthlyFees, password } = req.body;

    const existingMember = await Member.findOne({ $or: [{ email }, { phone }] });
    if (existingMember) {
      const field = existingMember.email === email ? 'email' : 'phone number';
      return res.status(400).json({ success: false, message: `A member with this ${field} already exists.` });
    }

    // FETCH OWNER DETAILS TO GET GYM NAME
    const owner = await GymOwner.findById(gymId);
    if (!owner) return res.status(404).json({ success: false, message: 'Gym Owner not found.' });

    const hashedPassword = await bcrypt.hash(password || 'gym123', 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newMember = new Member({
      gymId, name, email, phone, joiningDate, membershipType, monthlyFees,
      password: hashedPassword,
      gymName: owner.gymName,
      verificationToken
    });

    await newMember.save();
    
    // Send verification email to member
    sendVerificationEmail(email, verificationToken, name, 'member');

    // Create fee entry for current month
    const today = new Date();
    const newFees = new Fees({
      memberId: newMember._id,
      gymId,
      amountDue: monthlyFees,
      dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      month: today.getMonth() + 1,
      year: today.getFullYear()
    });

    await newFees.save();

    res.status(201).json({
      success: true,
      message: 'Member added successfully!',
      member: newMember
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET ALL MEMBERS OF GYM
app.get('/api/members/:gymId', authenticateToken, async (req, res) => {
  try {
    const members = await Member.find({ gymId: req.params.gymId });
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE MEMBER
app.get('/api/members/detail/:memberId', authenticateToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE MEMBER
app.put('/api/members/edit/:memberId', authenticateToken, async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.memberId,
      req.body,
      { new: true }
    );
    res.json({ success: true, message: 'Member updated!', member: updatedMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE MEMBER
app.delete('/api/members/delete/:memberId', authenticateToken, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.memberId);
    res.json({ success: true, message: 'Member deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ATTENDANCE ROUTES
// ============================================

// CHECK IN
app.post('/api/attendance/checkin', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingCheckIn = await Attendance.findOne({
      memberId,
      date: { $gte: today }
    });

    if (existingCheckIn && !existingCheckIn.checkOutTime) {
      return res.status(400).json({ success: false, message: 'Already checked in today!' });
    }

    const newCheckIn = new Attendance({
      memberId,
      checkInTime: new Date(),
      date: today
    });

    await newCheckIn.save();

    res.status(201).json({
      success: true,
      message: '✅ Check-in successful!',
      attendance: newCheckIn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SCAN ATTENDANCE (Comprehensive)
app.post('/api/attendance/scan', authenticateToken, async (req, res) => {
  try {
    let { memberId, gymId, action, scannedId } = req.body;
    
    // Determine memberId and gymId based on who is scanning
    if (req.user.role === 'member') {
      memberId = req.user.id;
      gymId = scannedId;
    } else if (req.user.role === 'owner' || req.user.role === 'admin') {
      gymId = req.user.id;
      memberId = scannedId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verify member exists
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    
    // Check for active session
    let session = await Attendance.findOne({
      memberId,
      date: { $gte: today },
      checkOutTime: null
    });

    // If explicit action is requested
    if (action === 'checkin' && session) {
      return res.status(400).json({ success: false, message: 'Member is already checked in!' });
    }
    if (action === 'checkout' && !session) {
      return res.status(400).json({ success: false, message: 'Member is not checked in!' });
    }

    const performCheckOut = async (s) => {
      const checkOutTime = new Date();
      const duration = Math.floor((checkOutTime - s.checkInTime) / 60000);
      s.checkOutTime = checkOutTime;
      s.duration = duration;
      await s.save();
      return { 
        success: true, 
        type: 'checkout', 
        message: '✅ Check-out successful!',
        duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
        attendance: s
      };
    };

    const performCheckIn = async () => {
      const newAttendance = new Attendance({
        memberId,
        checkInTime: new Date(),
        date: today
      });
      await newAttendance.save();
      return { 
        success: true, 
        type: 'checkin', 
        message: '✅ Check-in successful!',
        attendance: newAttendance
      };
    };

    if (action === 'checkout' || (!action && session)) {
      const result = await performCheckOut(session);
      return res.json(result);
    } else {
      const result = await performCheckIn();
      return res.json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CHECK OUT
app.post('/api/attendance/checkout', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      memberId,
      date: { $gte: today },
      checkOutTime: null
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No active check-in found!' });
    }

    const checkOutTime = new Date();
    const duration = Math.floor((checkOutTime - attendance.checkInTime) / 60000); // in minutes

    attendance.checkOutTime = checkOutTime;
    attendance.duration = duration;

    await attendance.save();

    res.json({
      success: true,
      message: '✅ Check-out successful!',
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// MEMBER MONTHLY REPORT
app.get('/api/reports/member/:memberId/:month/:year', authenticateToken, async (req, res) => {
  try {
    const { memberId, month, year } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });

    const attendedDays = [...new Set(attendanceRecords.map(r => new Date(r.date).getDate()))];
    const totalMinutes = attendanceRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    const member = await Member.findById(memberId);

    res.json({
      success: true,
      daysAttended: attendedDays.length,
      totalHours: (totalMinutes / 60).toFixed(1),
      attendedDays,
      feesPaid: member?.status === 'active',
      feesAmount: 1000
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET DAILY ATTENDANCE (Single Day)
app.get('/api/attendance/daily/:memberId/:date', authenticateToken, async (req, res) => {
  try {
    const { memberId, date } = req.params;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET MONTHLY ATTENDANCE (Count)
app.get('/api/attendance/monthly/:memberId/:month/:year', authenticateToken, async (req, res) => {
  try {
    const { memberId, month, year } = req.params;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await Attendance.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });

    res.json({
      success: true,
      totalDays: attendances.length,
      attendances
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET WEEKLY ATTENDANCE
app.get('/api/attendance/weekly/:memberId/:startDate', authenticateToken, async (req, res) => {
  try {
    const { memberId, startDate } = req.params;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const attendances = await Attendance.find({
      memberId,
      date: { $gte: start, $lte: end }
    });

    res.json({
      success: true,
      totalDays: attendances.length,
      attendances
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// FEES ROUTES
// ============================================

// GET PENDING FEES
app.get('/api/fees/pending/:memberId', authenticateToken, async (req, res) => {
  try {
    const pendingFees = await Fees.find({
      memberId: req.params.memberId,
      paymentStatus: 'pending'
    });

    const totalPending = pendingFees.reduce((sum, fee) => sum + fee.amountDue, 0);

    res.json({
      success: true,
      pendingFees,
      totalPending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PROCESS PAYMENT
app.post('/api/fees/payment', authenticateToken, async (req, res) => {
  try {
    const { feeId, paymentMethod } = req.body;

    const fee = await Fees.findByIdAndUpdate(
      feeId,
      {
        paymentStatus: 'paid',
        paymentDate: new Date(),
        paymentMethod
      },
      { new: true }
    );

    res.json({
      success: true,
      message: '✅ Payment successful!',
      fee
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET PAYMENT HISTORY
app.get('/api/fees/history/:memberId', authenticateToken, async (req, res) => {
  try {
    const history = await Fees.find({ memberId: req.params.memberId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// REPORTS ROUTES
// ============================================

// WEEKLY REPORT
app.get('/api/reports/weekly/:gymId', authenticateToken, async (req, res) => {
  try {
    const { gymId } = req.params;
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const members = await Member.find({ gymId });
    const weeklyData = [];

    for (let member of members) {
      const attendances = await Attendance.find({
        memberId: member._id,
        date: { $gte: weekStart }
      });

      const fees = await Fees.findOne({
        memberId: member._id,
        paymentStatus: 'pending'
      });

      weeklyData.push({
        member: member.name,
        daysAttended: attendances.length,
        feesStatus: fees ? 'Pending' : 'Paid',
        feesAmount: fees ? fees.amountDue : 0
      });
    }

    res.json({ success: true, weeklyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// MONTHLY REPORT
app.get('/api/reports/monthly/:gymId/:month/:year', authenticateToken, async (req, res) => {
  try {
    const { gymId, month, year } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const members = await Member.find({ gymId });
    const monthlyData = [];

    for (let member of members) {
      const attendances = await Attendance.find({
        memberId: member._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const fees = await Fees.findOne({
        memberId: member._id,
        month: parseInt(month),
        year: parseInt(year)
      });

      monthlyData.push({
        member: member.name,
        daysAttended: attendances.length,
        feesPaid: fees && fees.paymentStatus === 'paid',
        feesAmount: fees ? fees.amountDue : 0
      });
    }

    res.json({ success: true, monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// MEMBER STATS
app.get('/api/reports/member/:memberId/:month/:year', authenticateToken, async (req, res) => {
  try {
    const { memberId, month, year } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const member = await Member.findById(memberId);
    const attendances = await Attendance.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });

    const fees = await Fees.findOne({
      memberId,
      month: parseInt(month),
      year: parseInt(year)
    });

    const totalDuration = attendances.reduce((sum, att) => sum + (att.duration || 0), 0);

    res.json({
      success: true,
      member: member.name,
      daysAttended: attendances.length,
      totalHours: Math.floor(totalDuration / 60),
      totalMinutes: totalDuration % 60,
      feesPaid: fees ? fees.paymentStatus === 'paid' : false,
      feesAmount: fees ? fees.amountDue : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// The "catchall" handler: for any request that doesn't 
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  🏋️ GYM MANAGEMENT APP - BACKEND       ║
  ║  Server Running on Port ${PORT}          ║
  ║  ✅ Ready to Accept Requests           ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
