app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "adarsh438tcsckandivali@gmail.com",
        pass: "rmdklolcsmswvyfw",
      },
    });

    var mailOptions = {
      from: "youremail@gmail.com",
      to: "thedebugarena@gmail.com",
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log(link);
  } catch (error) {}
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});









const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"SkillTree" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email - SkillTree",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif; border-radius:16px;">
  <table width="100%"  cellpadding="0" cellspacing="0" style="background-color:#f0f4f0; padding:0; border-radius:16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff; border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a5c2a 0%,#2e8b4a 60%,#4caf72 100%);padding:48px 40px 36px;">
              <div style="font-size:48px;margin-bottom:12px;">🌳</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;text-shadow:0 1px 3px rgba(0,0,0,0.2);">SkillTree</h1>
              <p style="margin:8px 0 0;color:#c8f0d4;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Grow Your Skills</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <h2 style="margin:0 0 16px;color:#1a3a24;font-size:24px;font-weight:700;">Welcome aboard!</h2>
              <p style="margin:0 0 24px;color:#4a5e52;font-size:16px;line-height:1.7;">
                You're one step away from unlocking your full potential. Please verify your email address to activate your <strong style="color:#2e8b4a;">SkillTree</strong> account and start your learning journey.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#2e8b4a,#4caf72);border-radius:50px;box-shadow:0 4px 15px rgba(46,139,74,0.4);">
                    <a href="${verificationUrl}" style="display:inline-block;padding:16px 48px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                      &nbsp;Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6fdf7;border-left:4px solid #2e8b4a;border-radius:0 8px 8px 0;margin:24px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#2e6b3e;font-size:14px;line-height:1.6;">
                      <strong>This link expires in 10 minutes.</strong><br/>
                      If you didn't create a SkillTree account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f6fdf7;padding:24px 48px;border-top:1px solid #e0ede4;">
              <p style="margin:0;color:#8a9e90;font-size:13px;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} SkillTree &nbsp;|&nbsp; Growing minds, one skill at a time <br/>
                <span style="font-size:12px;">You received this email because an account was created with this address.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"SkillTree" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password - SkillTree",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif; border-radius:16px;">
  <table width="100%"  cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:0; border-radius:16px;">
    <tr>
      <td align="center">
        <table width="600"  cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a3a5c 0%,#2e5b8b 60%,#4c86af 100%);padding:48px 40px 36px;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;text-shadow:0 1px 3px rgba(0,0,0,0.2);">SkillTree</h1>
              <p style="margin:8px 0 0;color:#c8dcf0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Password Reset</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <h2 style="margin:0 0 16px;color:#1a2a3a;font-size:24px;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#4a5260;font-size:16px;line-height:1.7;">
                We received a request to reset the password for your <strong style="color:#2e5b8b;">SkillTree</strong> account. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#2e5b8b,#4c86af);border-radius:50px;box-shadow:0 4px 15px rgba(46,91,139,0.4);">
                    <a href="${resetUrl}" style="display:inline-block;padding:16px 48px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                    Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8f0;border-left:4px solid #e8843a;border-radius:0 8px 8px 0;margin:24px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#7a4a1e;font-size:14px;line-height:1.6;">
                      <strong>This link expires in 10 minutes.</strong><br/>
                      If you didn't request a password reset, please ignore this email — your password will remain unchanged.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9ff;border-radius:8px;margin:16px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#5a6070;font-size:13px;line-height:1.6;">
                    <strong>Security tip:</strong> SkillTree will never ask for your password via email. If something seems off, contact our support team.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f6f8fd;padding:24px 48px;border-top:1px solid #e0e4ed;">
              <p style="margin:0;color:#8a90a0;font-size:13px;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} SkillTree &nbsp;|&nbsp; Growing minds, one skill at a time<br/>
                <span style="font-size:12px;">You received this email because a password reset was requested for this address.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };