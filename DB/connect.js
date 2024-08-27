import mongoose from "mongoose";

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_url);
    console.log("DB connected");
  } catch (error) {
    console.error("Error in connection:");
  }
};

export default connectDB;
