const serviceService = require("../services/service.service");

/*
|--------------------------------------------------------------------------
| Get All Services
|--------------------------------------------------------------------------
*/

const getServices = async (req, res, next) => {
  try {
    const services = await serviceService.getServices(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Service By ID
|--------------------------------------------------------------------------
*/

const getServiceById = async (req, res, next) => {
  try {
    const service = await serviceService.getServiceById(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Service fetched successfully",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create Service
|--------------------------------------------------------------------------
*/

const createService = async (req, res, next) => {
  try {
    const service = await serviceService.createService(
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Service
|--------------------------------------------------------------------------
*/

const updateService = async (req, res, next) => {
  try {
    const service = await serviceService.updateService(
      req.user.id,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Delete Service
|--------------------------------------------------------------------------
*/

const deleteService = async (req, res, next) => {
  try {
    const result = await serviceService.deleteService(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};