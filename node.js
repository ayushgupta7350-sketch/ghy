const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create transporter for sending emails
// Use Gmail SMTP with an App Password
// Replace the values below with your Gmail address and App Password
// For Gmail, you must create an App Password in your Google account security settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-gmail@gmail.com', // Replace with your Gmail address
    pass: 'your-gmail-app-password' // Replace with your Gmail App Password
  }
});

// Store OTPs temporarily (in production, use database or Redis)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = generateOTP();
  otpStore.set(email, { otp, timestamp: Date.now() });

  // Email options
  const mailOptions = {
    from: 'noreply@agcoffee.com',
    to: email,
    subject: 'Your OTP for AG Coffee Contact Form',
    text: `Your OTP is: ${otp}. This OTP will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>AG Coffee - OTP Verification</h2>
        <p>Your OTP for contact form submission is:</p>
        <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedData = otpStore.get(email);

  if (!storedData) {
    return res.status(400).json({ error: 'OTP not found or expired' });
  }

  // Check if OTP is expired (10 minutes)
  const now = Date.now();
  const otpAge = now - storedData.timestamp;
  if (otpAge > 10 * 60 * 1000) { // 10 minutes
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedData.otp === otp) {
    otpStore.delete(email); // Remove used OTP
    res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Endpoint to send contact message (after OTP verification)
app.post('/send-message', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  // Email options for contact message
  const mailOptions = {
    from: email,
    to: 'contact@agcoffee.com', // Replace with actual contact email
    subject: `Contact Form Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Contact message sent from ${email}`);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});