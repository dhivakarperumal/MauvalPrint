const jwt = require("jsonwebtoken");

const issueAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured before issuing access tokens.");
  }

  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user.user_id,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "mauval-print",
    }
  );
};

module.exports = { issueAccessToken };