const nodemailer = require("nodemailer");

// Mailtrap transport
const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "39efa5960f595a",
    pass: "****d9a5",
  },
});

const sendOTPEmail = async (to, otp) => {
  try {
    const info = await transport.sendMail({
      from: '"Shooper" <no-reply@shooper.com>',
      to,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is: <b>${otp}</b></p>`,
    });
    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = { sendOTPEmail };
