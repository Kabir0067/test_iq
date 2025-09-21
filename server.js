import path from 'path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security & performance
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { maxAge: '1y', etag: true }));

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Email transporter (ENV-driven)
function createTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = !!(process.env.SMTP_SECURE && process.env.SMTP_SECURE !== 'false');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const opts = {
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  };
  return nodemailer.createTransport(opts);
}

const LOVER_EMAIL = (process.env.LOVER_EMAIL || process.env.EMAIL_HOST_USER || '').trim();

// Routes
app.get(['/', '/index'], (req, res) => {
  res.render('index', {
    recipient_email: LOVER_EMAIL || ''
  });
});

app.get('/love', (req, res) => {
  res.render('love');
});

app.post(['/save-location', '/save-location/'], async (req, res) => {
  try {
    const { lat, lon, accuracy, recipient_email } = req.body || {};
    const to = (recipient_email || LOVER_EMAIL || '').trim();
    if (!to) {
      return res.status(400).json({ ok: false, error: 'Recipient email required' });
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return res.status(400).json({ ok: false, error: 'Invalid coordinates' });
    }

    const subject = '📍 Location (by consent) — Kabir';
    const message = `Lat: ${latNum}\nLon: ${lonNum}\nAccuracy(m): ${accuracy ?? 'n/a'}`;

    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@sipehra-node',
      to,
      subject,
      text: message,
    });

    res.json({ ok: true, redirect: '/love' });
  } catch (err) {
    console.error('send error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
