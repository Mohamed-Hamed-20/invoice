import crypto from "crypto";

export const randomPass = async (length = 12) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};
