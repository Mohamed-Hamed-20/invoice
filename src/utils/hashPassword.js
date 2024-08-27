import bcrypt from "bcrypt";

export const hashpassword = async ({
  password,
  saltRound = parseInt(process.env.salt_Round),
} = {}) => {
  try {
    if (!password || !saltRound) {
      throw new Error("password and salt_Round Required", { cause: 500 });
    }
    const hashpassword = await bcrypt.hash(password, parseInt(saltRound));
    if (!hashpassword) {
      throw new Error("Error in create Hash password", { cause: 500 });
    }
    return hashpassword;
  } catch (error) {
    throw new Error(error);
  }
};

export const verifypass = async ({ password, hashpassword } = {}) => {
  try {
    const matched = bcrypt.compareSync(password, hashpassword);
    return matched;
  } catch (error) {
    throw new Error(error.message);
  }
};
