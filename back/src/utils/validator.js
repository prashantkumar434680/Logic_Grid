const validator = require("validator");

const validate = (data) => {
  const mandatoryField = ['firstName', 'emailId', 'password'];

  const isAllowed = mandatoryField.every((k) => Object.keys(data).includes(k));

  if (!isAllowed)
    throw new Error("Some fields are missing");

  if (!validator.isEmail(data.emailId))
    throw new Error("Invalid email address");

  if (!validator.isStrongPassword(data.password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }))
    throw new Error("Weak password"); // ← fixed typo: "Week" → "Weak"
};

module.exports = validate;