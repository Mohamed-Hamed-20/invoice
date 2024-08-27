import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      minlength: 3,
      maxlength: 66,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      minlength: 5,
      maxlength: 77,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      minlength: 6,
      maxlength: 80,
      required: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    gender: {
      type: String,
      lowercase: true,
      enum: ["male", "female"],
      default: "male",
      required: false,
    },
    birthdate: {
      type: Date,
      required: false,
    },
    imgUrl: {
      type: String,
      minlength: 5,
      maxlength: 500,
      default:
        "https://mohamed-files.s3.amazonaws.com/default-avatar-icon-of-social-media-user-vector.jpg",
    },
    role: {
      type: String,
      enum: ["Admin", "user"],
      default: "user",
      required: true,
    },
    isconfrimed: {
      type: Boolean,
      default: true,
      required: false,
    },
    Activecode: {
      type: String,
      min: 6,
      max: 500,
      required: false,
    },
    Agents: [
      {
        type: String,
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 });

const userModel = model("user", userSchema);

export default userModel;
