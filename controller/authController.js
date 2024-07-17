const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const BadRequestError = require("../errors/bad-request");
const UnauthenticatedError = require("../errors/unauthenticated");

const register = async (req, res) => {
  console.log(req.body);
  const user = await User.create({ ...req.body });
  const accessToken = user.createJwt();
  const refreshToken = user.createRefreshJwt();
  res
    .status(StatusCodes.CREATED)
    .json({ user: { name: user.firstName }, accessToken, refreshToken });
};

const login = async (req, res) => {
  const { userEmail, password } = req.body;
  if (!userEmail || !password) {
    throw new BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ userEmail });

  if (!user) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Incorrect password");
  }

  const accessToken = user.createJwt();
  const refreshToken = user.createRefreshJwt();
  res
    .status(StatusCodes.OK)
    .json({ user: { name: user.firstName }, accessToken, refreshToken });
};

module.exports = { register, login };
