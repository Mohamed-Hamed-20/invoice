import multer from "multer";
import { CustomError } from "../utils/errorHandling.js";
import sharp from "sharp";

export const allowedExtensions = {
  Image: [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/jfif",
    "image/webp",
    "image/tiff",
    "application/octet-stream",
  ],
  Files: ["application/pdf", "application/javascript"],
  Videos: ["video/mp4"],
};

export class MulterConfig {
  constructor(allowedExtensionsArr = allowedExtensions.Image) {
    this.allowedExtensionsArr = allowedExtensionsArr;
    this.storage = multer.memoryStorage();
    this.fileFilter = this._fileFilter.bind(this);
  }

  _fileFilter(req, file, cb) {
    if (this.allowedExtensionsArr.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new CustomError("Invalid file extension", 400), false);
  }

  upload() {
    return multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    });
  }
}

export const uploadMiddleware = (allowedExtensionsArr, field) => {
  const multerInstance = new MulterConfig(allowedExtensionsArr).upload();
  return multerInstance.single(field);
};

export const reSizeImage = async ({ file, width, height, quality }) => {
  const buffer = await sharp(file.buffer)
    .resize({ width, height, fit: "contain" })
    .jpeg({ quality })
    .toBuffer();

  return buffer;
};
