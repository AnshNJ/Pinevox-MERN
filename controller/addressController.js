const Address = require("../models/Address");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const saveAddress = async (req, res) => {
  try {
    const { userId, username } = req.user;
    const addressData = { ...req.body, user: userId };

    const address = await Address.findOneAndUpdate(
      { user: userId },
      addressData,
      { upsert: true, new: true, runValidators: true }
    );

    res
      .status(StatusCodes.CREATED)
      .json({ address, msg: `Address updated successfully for user: ${username}` });
  } catch (err) {
    throw new BadRequestError(err);
  }
};

const findAddress = async (req, res) => {
  const { userId, username } = req.user;
  const address = await Address.findOne({ user: userId });
  if (!address) {
    throw new NotFoundError(`Address not found for user: ${username}`);
  }
  res.status(StatusCodes.OK).json({ address });
};

module.exports = { saveAddress, findAddress };
