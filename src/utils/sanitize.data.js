export const sanitizeUser = (user) => {
  return {
    _id: user?._id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    gender: user?.gender,
    imgUrl: user?.imgUrl,
    role: user?.role,
    birthdate: user?.birthdate,
  };
};
