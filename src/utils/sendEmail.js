import nodemailer from "nodemailer";
import { confirmEmailTemplet, sendCodeTemplet } from "./templetHtml.js";
import { generateToken } from "./token.js";

export const sendEmail = async ({ to, subject, html, bcc } = {}) => {
  try {
    /*=================================================*/
    //create Transport to send Email
    const transporter = nodemailer.createTransport({
      host: "localhost",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    // send Email
    const info = await transporter.sendMail({
      from: `"Mohamed Hamed - OM Team" <${process.env.email}>`, // sender address
      to,
      bcc,
      subject,
      text: "Hello world?",
      html,
    });

    //if error return error
    if (info?.accepted?.length < 1) {
      throw new Error("Email Not send Successfully", { code: 500 });
    }

    // return done
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

export const sendconfirmEmail = async (user, link) => {
  try {
    const token = await generateToken({
      payload: { userId: user._id, role: user.role },
      signature: process.env.DEFAULT_SIGNATURE,
      expiresIn: process.env.ConfirmEmailExpireIn,
    });

    link = `${link}/${token}`;
    const html = await confirmEmailTemplet(link);
    const isSend = await sendEmail({
      to: user.email,
      subject: "This Message to confirm your Email",
      html: html,
    });

    // result
    return isSend ? true : false;
  } catch (error) {
    throw new Error(error);
  }
};

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendCode = async ({ email, name } = {}) => {
  console.log({ email, name });
  const code = generateVerificationCode();
  const html = await sendCodeTemplet({ name, code });
  const isSend = await sendEmail({
    to: email,
    subject: "this code to verify you owner of this this account",
    html: html,
  });

  return isSend ? code : false;
};
