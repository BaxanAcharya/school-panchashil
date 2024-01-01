import { handleAsync } from "../utils/handleAsync.js";

const addAdmin = handleAsync(async (req, res) => {
  //   const { fullName, email, password } = req.body;
  //   const admin = new Admin({ fullName, email, password });
  //   await admin.save();
  res.status(201).json({ admin: "asdasdasd" });
});

export { addAdmin };
