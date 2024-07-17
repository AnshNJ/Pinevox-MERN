const Services = require("../models/Services");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");

const saveService = async (req, res) => {
  try {
    const { userId, username } = req.user;
    const serviceData = { ...req.body, user: userId };

    const service = await Services.findOneAndUpdate(
      { user: userId },
      serviceData,
      {upsert: true, new: true, runValidators: true}
    );
    res
      .status(StatusCodes.CREATED)
      .json({ service, msg: `Service added successfully for user: ${username}` });
  } catch (error) {
    throw new BadRequestError(error);
  }
};

const findService = async (req, res) => {
  const { userId, username } = req.user;
  const service = await Services.findOne({ user: userId });
  if (!service) {
    throw new NotFoundError(`Services not found for user: ${username}`);
  }
  res.status(StatusCodes.OK).json({ service });
};

module.exports = { saveService, findService };
