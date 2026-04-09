const winston = require("winston");
require("winston-mongodb");

// check what is the client IP
const buildClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};

const maskEmail = (emailId = "") => {
  const normalizedEmail = String(emailId).trim().toLowerCase();

  if (!normalizedEmail.includes("@")) {
    return normalizedEmail || "unknown";
  }

  const [localPart, domain] = normalizedEmail.split("@");
  const visibleLocal = localPart.slice(0, 2);
  return `${visibleLocal}${"*".repeat(Math.max(localPart.length - 2, 0))}@${domain}`;
};

const transports = [
  new winston.transports.Console({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  }),
];

if (process.env.STRING) {
  try {
    transports.push(
      new winston.transports.MongoDB({
        level: "info",
        db: process.env.STRING,
        collection: "login_audit_logs",
        tryReconnect: true,
        options: {
          useUnifiedTopology: true,
        },
        metaKey: "metadata",
        decolorize: true,
      })
    );
  } catch (error) {
    console.error("MongoDB login audit transport could not be initialized:", error.message);
  }
}

// create a Logger instance for login audit logs
const loginAuditLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "logicgrid-auth",
  },
  transports,
});

const logLoginAttempt = ({
  req,
  emailId,
  user,
  status,
  reason,
  provider = "password",
}) => {
  try {
    const logMethod = status === "success" ? "info" : "warn";

    loginAuditLogger[logMethod]("login_attempt", {
      event: "login_attempt",
      provider,
      status,
      reason,
      emailId: maskEmail(emailId),
      userId: user?._id?.toString?.(),
      role: user?.role,
      isAccountVerified: user?.isAccountVerified,
      ipAddress: buildClientIp(req),
      userAgent: req.get("user-agent") || "unknown",
    });
  } catch (error) {
    console.error("Failed to write login audit log:", error.message);
  }
};

module.exports = {
  loginAuditLogger,
  logLoginAttempt,
};
