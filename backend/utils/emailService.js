import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendCertificateEmail = async (to, password) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Kenya Math Quest Certificate",
    text: `Your certificate password is: ${password}`,
  });
};
