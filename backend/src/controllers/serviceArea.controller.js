const serviceAreaService = require('../services/serviceArea.service');

const listAreas = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;

    const areas = await serviceAreaService.listAreas(
      providerId
    );

    res.status(200).json({
      success: true,
      data: areas,
    });
  } catch (error) {
    next(error);
  }
};

const createArea = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;

    const area = await serviceAreaService.createArea(
      providerId,
      req.body
    );

    res.status(201).json({
      success: true,
      data: area,
    });
  } catch (error) {
    next(error);
  }
};

const updateArea = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;
    const { id } = req.params;

    const area = await serviceAreaService.updateArea(
      providerId,
      id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: area,
    });
  } catch (error) {
    next(error);
  }
};

const deleteArea = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;
    const { id } = req.params;

    const result = await serviceAreaService.deleteArea(
      providerId,
      id
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAreas,
  createArea,
  updateArea,
  deleteArea,
};