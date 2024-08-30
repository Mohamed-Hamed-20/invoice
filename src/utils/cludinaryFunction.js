import cloudinary from "./cloudinary.js";

export const uploadImage = async ({ buffer, folder }) => {
  try {
    const { secure_url, public_id } = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder, unique_filename: true, use_filename: true },
          (error, result) => {
            if (error)
              return reject(
                new Error(`Failed to upload image: ${error.message}`)
              );
            resolve(result);
          }
        )
        .end(buffer);
    });
    return { secure_url, public_id };
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const updatedImage = async ({ buffer, user }) => {
  try {
    const { secure_url, public_id } = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { public_id: user.public_id, overwrite: true },
          (error, result) => {
            if (error)
              return reject(
                new Error(`Failed to update image: ${error.message}`)
              );
            resolve(result);
          }
        )
        .end(buffer);
    });
    return { secure_url, public_id };
  } catch (error) {
    throw new Error(`Failed to update image: ${error.message}`);
  }
};

export const deleteImage = async () => {};
