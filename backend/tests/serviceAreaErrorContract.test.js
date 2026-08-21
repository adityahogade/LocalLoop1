const models = require("../src/models");
const serviceAreaService = require("../src/services/serviceArea.service");

describe("service area error contract", () => {
  test("duplicate service area errors use the AppError contract", async () => {
    jest.spyOn(models.Provider, "findByPk").mockResolvedValue({ id: 42 });
    jest.spyOn(models.ServiceArea, "findOne").mockResolvedValue({ id: 1, pincode: "110001" });

    await expect(
      serviceAreaService.createArea(42, { pincode: "110001", state: "Delhi", city: "Delhi" })
    ).rejects.toMatchObject({
      message: "This pincode is already configured",
      statusCode: 409,
      code: "SERVICE_AREA_EXISTS",
    });

    models.Provider.findByPk.mockRestore();
    models.ServiceArea.findOne.mockRestore();
  });
});
