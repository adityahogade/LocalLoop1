const { Op } = require("sequelize");
const { Service, ServicePlan, Provider, Category, ServiceArea } = require("../models");

const MAX_CUSTOMER_RADIUS_KM = 25;

const getDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getBaseInclude = () => [
  {
    model: Provider,
    as: "provider",
    attributes: [
      "id",
      "business_name",
      "business_description",
      "logo_url",
      "average_rating",
      "latitude",
      "longitude",
      "service_radius_km"
    ],
    where: { is_active: true, kyc_status: "approved" }
  },
  {
    model: Category,
    as: "category",
    attributes: ["id", "name", "slug"]
  },
  {
    model: ServicePlan,
    as: "plans",
    where: { is_active: true },
    required: false
  }
];

const services = async (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const where = { is_active: true };

  if (query.category_id) where.category_id = query.category_id;
  if (query.provider_id) where.provider_id = query.provider_id;
  if (query.type) where.type = query.type;
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { description: { [Op.like]: `%${query.search}%` } }
    ];
  }
  if (query.min_price !== undefined || query.max_price !== undefined) {
    where.base_price = {
      ...(query.min_price !== undefined ? { [Op.gte]: query.min_price } : {}),
      ...(query.max_price !== undefined ? { [Op.lte]: query.max_price } : {})
    };
  }

  const localInclude = getBaseInclude();

  const hasCoords = query.latitude !== undefined && query.longitude !== undefined && query.latitude !== null && query.longitude !== null && String(query.latitude).trim() !== '' && String(query.longitude).trim() !== '';
  const customerLat = hasCoords ? parseFloat(query.latitude) : null;
  const customerLon = hasCoords ? parseFloat(query.longitude) : null;

  if (!hasCoords && query.pincode) {
    localInclude[0].include = [{
      model: ServiceArea,
      as: "serviceAreas",
      where: { pincode: query.pincode },
      required: true
    }];
  }

  const allRows = await Service.findAll({
    where,
    include: localInclude,
    order: [["created_at", "DESC"]]
  });

  let filteredRows = allRows;

  if (hasCoords && !isNaN(customerLat) && !isNaN(customerLon)) {
    const rawRadius = (query.radius_km !== undefined && query.radius_km !== null && String(query.radius_km).trim() !== '') ? parseFloat(query.radius_km) : MAX_CUSTOMER_RADIUS_KM;
    const effectiveCustomerRadius = Math.min(isNaN(rawRadius) ? MAX_CUSTOMER_RADIUS_KM : rawRadius, MAX_CUSTOMER_RADIUS_KM);

    filteredRows = allRows.filter(serviceItem => {
      const provider = serviceItem.provider;
      if (!provider) return false;
      if (provider.latitude === null || provider.longitude === null) {
        return false;
      }
      const latP = parseFloat(provider.latitude);
      const lonP = parseFloat(provider.longitude);
      if (isNaN(latP) || isNaN(lonP)) return false;

      const distance = getDistance(customerLat, customerLon, latP, lonP);
      if (distance === null || isNaN(distance)) return false;

      const roundedDistance = Math.round(distance * 100) / 100;
      serviceItem.setDataValue('distance', roundedDistance);
      serviceItem.setDataValue('distance_km', roundedDistance);

      const providerRadius = parseFloat(provider.service_radius_km || 10.00);
      const effectiveRadius = Math.min(effectiveCustomerRadius, isNaN(providerRadius) ? 10.00 : providerRadius);

      return distance <= effectiveRadius;
    });

    filteredRows.sort((a, b) => (a.getDataValue('distance') ?? 0) - (b.getDataValue('distance') ?? 0));
  }

  const total = filteredRows.length;
  const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

  return {
    items: paginatedRows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const service = async (id, query = {}) => {
  const localInclude = getBaseInclude();
  const result = await Service.findOne({
    where: { id, is_active: true },
    include: localInclude
  });

  if (!result) {
    throw Object.assign(new Error("Service not found"), { statusCode: 404, code: "SERVICE_NOT_FOUND" });
  }

  const commissionService = require("./commission.service");
  const { percent } = await commissionService.commissionPercentFor({ serviceId: result.id, categoryId: result.category_id });
  result.setDataValue('commission_percent', percent);

  const basePrice = Number(result.base_price || 0);
  const baseComm = Math.round(basePrice * percent) / 100;
  result.setDataValue('provider_price', basePrice);
  result.setDataValue('customer_price', Number((basePrice + baseComm).toFixed(2)));

  if (result.plans && result.plans.length) {
    for (const plan of result.plans) {
      const planPrice = Number(plan.price || 0);
      const planComm = Math.round(planPrice * percent) / 100;
      plan.setDataValue('provider_price', planPrice);
      plan.setDataValue('commission_percent', percent);
      plan.setDataValue('commission_amount', planComm);
      plan.setDataValue('customer_price', Number((planPrice + planComm).toFixed(2)));
    }
  }

  const hasCoords = query.latitude !== undefined && query.longitude !== undefined && query.latitude !== null && query.longitude !== null && String(query.latitude).trim() !== '';
  if (hasCoords && result.provider && result.provider.latitude !== null && result.provider.longitude !== null) {
    const customerLat = parseFloat(query.latitude);
    const customerLon = parseFloat(query.longitude);
    const latP = parseFloat(result.provider.latitude);
    const lonP = parseFloat(result.provider.longitude);
    if (!isNaN(customerLat) && !isNaN(customerLon) && !isNaN(latP) && !isNaN(lonP)) {
      const distance = getDistance(customerLat, customerLon, latP, lonP);
      if (distance !== null && !isNaN(distance)) {
        const roundedDistance = Math.round(distance * 100) / 100;
        result.setDataValue('distance', roundedDistance);
        result.setDataValue('distance_km', roundedDistance);
      }
    }
  }

  return result;
};

const categories = () => Category.findAll({ where: { is_active: true }, order: [["name", "ASC"]] });

const providers = async (query = {}) => {
  const allProviders = await Provider.findAll({
    where: { is_active: true, kyc_status: "approved" },
    attributes: ["id", "business_name", "business_description", "logo_url", "average_rating", "latitude", "longitude", "service_radius_km"],
    include: [{
      model: Service,
      as: "services",
      where: { is_active: true },
      required: false,
      attributes: ["id", "name", "type", "base_price", "unit"]
    }],
    order: [["average_rating", "DESC"]]
  });

  const hasCoords = query.latitude !== undefined && query.longitude !== undefined && query.latitude !== null && query.longitude !== null && String(query.latitude).trim() !== '' && String(query.longitude).trim() !== '';
  if (!hasCoords) return allProviders;

  const customerLat = parseFloat(query.latitude);
  const customerLon = parseFloat(query.longitude);
  if (isNaN(customerLat) || isNaN(customerLon)) return allProviders;

  const rawRadius = (query.radius_km !== undefined && query.radius_km !== null && String(query.radius_km).trim() !== '') ? parseFloat(query.radius_km) : MAX_CUSTOMER_RADIUS_KM;
  const effectiveCustomerRadius = Math.min(isNaN(rawRadius) ? MAX_CUSTOMER_RADIUS_KM : rawRadius, MAX_CUSTOMER_RADIUS_KM);

  const filtered = allProviders.filter(prov => {
    if (prov.latitude === null || prov.longitude === null) return false;
    const latP = parseFloat(prov.latitude);
    const lonP = parseFloat(prov.longitude);
    if (isNaN(latP) || isNaN(lonP)) return false;

    const distance = getDistance(customerLat, customerLon, latP, lonP);
    if (distance === null || isNaN(distance)) return false;

    const roundedDistance = Math.round(distance * 100) / 100;
    prov.setDataValue('distance', roundedDistance);
    prov.setDataValue('distance_km', roundedDistance);

    const providerRadius = parseFloat(prov.service_radius_km || 10.00);
    const effectiveRadius = Math.min(effectiveCustomerRadius, isNaN(providerRadius) ? 10.00 : providerRadius);

    return distance <= effectiveRadius;
  });

  filtered.sort((a, b) => (a.getDataValue('distance') ?? 0) - (b.getDataValue('distance') ?? 0));
  return filtered;
};

module.exports = { services, service, categories, providers };
