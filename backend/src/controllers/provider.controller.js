const providerService = require("../services/provider.service");

/*
|--------------------------------------------------------------------------
| Get All Providers
|--------------------------------------------------------------------------
*/

const getAllProviders = async (req, res, next) => {
  try {
    const providers = await providerService.getAllProviders();

    return res.status(200).json({
      success: true,
      message: "Providers retrieved successfully",
      data: providers,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Provider By ID
|--------------------------------------------------------------------------
*/

const getProviderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const provider = await providerService.getProviderById(id);

    return res.status(200).json({
      success: true,
      message: "Provider retrieved successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create Provider
|--------------------------------------------------------------------------
*/

const createProvider = async (req, res, next) => {
  try {
    const provider = await providerService.createProvider(req.body);

    return res.status(201).json({
      success: true,
      message: "Provider created successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Provider
|--------------------------------------------------------------------------
*/

const updateProvider = async (req, res, next) => {
  try {
    const { id } = req.params;

    const provider = await providerService.updateProvider(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Provider updated successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Provider Status
|--------------------------------------------------------------------------
*/

const updateProviderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const provider = await providerService.updateProviderStatus(
      id,
      is_active
    );

    return res.status(200).json({
      success: true,
      message: "Provider status updated successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Provider KYC
|--------------------------------------------------------------------------
*/

const updateProviderKyc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      kyc_status,
      kyc_rejection_reason,
    } = req.body;

    const provider = await providerService.updateProviderKyc(
      id,
      kyc_status,
      kyc_rejection_reason
    );

    return res.status(200).json({
      success: true,
      message: "Provider KYC status updated successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get My Provider Profile
|--------------------------------------------------------------------------
|
| GET /api/providers/me
|
*/

const getMyProviderProfile = async (req, res, next) => {
  try {
    const provider =
      await providerService.getMyProviderProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Provider profile fetched successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update My Provider Profile
|--------------------------------------------------------------------------
|
| PATCH /api/providers/me
|
*/

const updateMyProviderProfile = async (req, res, next) => {
  try {
    const provider =
      await providerService.updateMyProviderProfile(
        req.user.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Provider profile updated successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  updateProviderStatus,
  updateProviderKyc,
  getMyProviderProfile,
updateMyProviderProfile,
};