const Packages = require('../models/Package');
const { StatusCodes } = require('http-status-codes');
const { BAD_REQUEST } = require('../errors');


const updatePackages = async (req,res) => {
    try {
        const { packages } = req.body;

        const updatePromises = packages.map(pkg => 
            Packages.findOneAndUpdate(
                { packageName: pkg.packageName },
                { cost: pkg.cost },
                { upsert: true, new: true, runValidators: true }
            )
        );

        await Promise.all(updatePromises); //makes sure all promises are resolved before moving on

        res.status(StatusCodes.CREATED).json({msg: 'Packages updated successfully.'});
    } catch (error) {
        throw new BAD_REQUEST(`Error updating packes: ${error}`);
    }
}

module.exports = {updatePackages};