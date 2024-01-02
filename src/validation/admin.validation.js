const validateFullName = (fullName) => {
  if (!fullName) {
    return "Please provide full name.";
  }
};

const validateEmail = (email) => {
  if (!email) {
    return "Please provide an email.";
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return "Please provide valid an email.";
  }
};

const validateOldPassword = (oldPassword) => {
  if (!oldPassword) {
    return "Please provide old password.";
  }
};

const validatePassword = (password, checkStrong = false) => {
  if (!password) {
    return "Please provide a password.";
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{7,}$/;
  if (checkStrong && !passwordRegex.test(password)) {
    return "Please provide a strong password. Password must contain minimum seven characters, at least one letter and one number.";
  }
};

export {
  validateEmail,
  validateFullName,
  validateOldPassword,
  validatePassword,
};
