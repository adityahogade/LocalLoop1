const models = require("../models");
const serviceAreaService = require("../services/serviceArea.service");

describe("service area error contract", () => {
  test("duplicate service area errors use the AppError contract", async () => {
    const Provider = models.Provider;
    const ServiceArea = models.ServiceArea;

    jest.spyOn(Provider, "findByPk").mockResolvedValue({ id: 42 });
    jest.spyOn(ServiceArea, "findOne").mockResolvedValue({ id: 1, pincode: "110001" });

    await expect(
      serviceAreaService.createArea(42, { pincode: "110001", state: "Delhi", city: "Delhi" })
    ).rejects.toMatchObject({
      message: "This pincode is already configured",
      statusCode: 409,
      code: "SERVICE_AREA_EXISTS",
    });

    Provider.findByPk.mockRestore();
    ServiceArea.findOne.mockRestore();
  });
});
