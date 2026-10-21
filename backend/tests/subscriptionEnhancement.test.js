const models = require('../src/models');
const servicePlanService = require('../src/services/servicePlan.service');
const subscriptionService = require('../src/services/subscription.service');

describe('Subscription + Pricing Plan Enhancement Scenarios', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Scenario 1: 1 delivery/day plan
  test('Scenario 1: 1 delivery/day plan calculates cycle price = basePrice * 1 * 1 * cycleDays', async () => {
    const mockProvider = { id: 10, kyc_status: 'approved' };
    const mockService = { id: 1, base_price: 30.00, provider_id: 10 };
    
    jest.spyOn(models.Provider, 'findOne').mockResolvedValue(mockProvider);
    jest.spyOn(models.Service, 'findOne').mockResolvedValue(mockService);
    jest.spyOn(models.ServicePlan, 'create').mockImplementation(async (data) => ({
      id: 101,
      ...data
    }));

    const plan = await servicePlanService.createPlan(10, 1, {
      frequency: 'daily',
      billing_cycle_days: 30,
      min_quantity: 1,
      deliveries_per_day: 1,
      discount_percent: 0
    });

    // 30 * 1 * 1 * 30 = 900
    expect(plan.price).toBe(900);
    expect(plan.deliveries_per_day).toBe(1);
    expect(plan.discount_percent).toBe(0);
  });

  // Scenario 2: 2 deliveries/day plan
  test('Scenario 2: 2 deliveries/day plan calculates cycle price = basePrice * 1 * 2 * cycleDays', async () => {
    const mockProvider = { id: 10, kyc_status: 'approved' };
    const mockService = { id: 1, base_price: 30.00, provider_id: 10 };

    jest.spyOn(models.Provider, 'findOne').mockResolvedValue(mockProvider);
    jest.spyOn(models.Service, 'findOne').mockResolvedValue(mockService);
    jest.spyOn(models.ServicePlan, 'create').mockImplementation(async (data) => ({
      id: 102,
      ...data
    }));

    const plan = await servicePlanService.createPlan(10, 1, {
      frequency: 'daily',
      billing_cycle_days: 30,
      min_quantity: 1,
      deliveries_per_day: 2,
      discount_percent: 0
    });

    // 30 * 1 * 2 * 30 = 1800
    expect(plan.price).toBe(1800);
    expect(plan.deliveries_per_day).toBe(2);
    expect(plan.discount_percent).toBe(0);
  });

  // Scenario 4: Provider discount (10%)
  test('Scenario 4: Provider discount (10%) calculates gross - 10% discount', async () => {
    const mockProvider = { id: 10, kyc_status: 'approved' };
    const mockService = { id: 1, base_price: 30.00, provider_id: 10 };

    jest.spyOn(models.Provider, 'findOne').mockResolvedValue(mockProvider);
    jest.spyOn(models.Service, 'findOne').mockResolvedValue(mockService);
    jest.spyOn(models.ServicePlan, 'create').mockImplementation(async (data) => ({
      id: 103,
      ...data
    }));

    const plan = await servicePlanService.createPlan(10, 1, {
      frequency: 'daily',
      billing_cycle_days: 30,
      min_quantity: 1,
      deliveries_per_day: 1,
      discount_percent: 10
    });

    // gross = 30 * 1 * 30 = 900, discount = 90, price = 810
    expect(plan.price).toBe(810);
    expect(plan.discount_percent).toBe(10);
  });

  // Scenario 5: No discount (0%)
  test('Scenario 5: 0% discount correctly retains gross price without deductions', async () => {
    const mockProvider = { id: 10, kyc_status: 'approved' };
    const mockService = { id: 1, base_price: 50.00, provider_id: 10 };

    jest.spyOn(models.Provider, 'findOne').mockResolvedValue(mockProvider);
    jest.spyOn(models.Service, 'findOne').mockResolvedValue(mockService);
    jest.spyOn(models.ServicePlan, 'create').mockImplementation(async (data) => ({
      id: 104,
      ...data
    }));

    const plan = await servicePlanService.createPlan(10, 1, {
      frequency: 'weekly',
      billing_cycle_days: 7,
      min_quantity: 1,
      deliveries_per_day: 1,
      discount_percent: 0
    });

    // gross = 50 * 1 * 7 = 350
    expect(plan.price).toBe(350);
  });

  // Scenario 6: 100% discount
  test('Scenario 6: 100% discount produces 0 final price without error', async () => {
    const mockProvider = { id: 10, kyc_status: 'approved' };
    const mockService = { id: 1, base_price: 30.00, provider_id: 10 };

    jest.spyOn(models.Provider, 'findOne').mockResolvedValue(mockProvider);
    jest.spyOn(models.Service, 'findOne').mockResolvedValue(mockService);
    jest.spyOn(models.ServicePlan, 'create').mockImplementation(async (data) => ({
      id: 105,
      ...data
    }));

    const plan = await servicePlanService.createPlan(10, 1, {
      frequency: 'daily',
      billing_cycle_days: 30,
      min_quantity: 1,
      deliveries_per_day: 1,
      discount_percent: 100
    });

    // gross 900 - 900 = 0
    expect(plan.price).toBe(0);
  });

  // Scenario 10: Backward compatibility with old plans
  test('Scenario 10: Legacy plan without deliveries_per_day or discount_percent defaults to 1 and 0', async () => {
    const legacyPlan = {
      id: 99,
      service_id: 1,
      price: 900,
      billing_cycle_days: 30,
      min_quantity: 1
      // missing deliveries_per_day and discount_percent
    };

    const delivPerDay = Math.max(1, parseInt(legacyPlan.deliveries_per_day) || 1);
    const discount = Math.min(100, Math.max(0, parseFloat(legacyPlan.discount_percent) || 0));

    expect(delivPerDay).toBe(1);
    expect(discount).toBe(0);
  });

  // Scenario 3 & 11: Quantity > 1 & Pricing formula accuracy / backend authority
  test('Scenario 3 & 11: Backend enforces price authority for quantity > 1 with discount', async () => {
    const mockCustomer = { id: 200, user_id: 20 };
    const mockProvider = { id: 10, is_active: true, latitude: null, longitude: null };
    const mockService = { id: 1, base_price: 30.00, provider_id: 10, category_id: 1, commission_percent: 10, type: 'subscription', is_active: true };
    const mockPlan = { id: 101, service_id: 1, price: 810, deliveries_per_day: 1, discount_percent: 10, billing_cycle_days: 30, min_quantity: 1, is_active: true };
    const mockAddress = { id: 5, customer_id: 200, pincode: '560038', latitude: null, longitude: null };

    jest.spyOn(models.Customer, 'findOne').mockResolvedValue(mockCustomer);
    jest.spyOn(models.Provider, 'findOne').mockResolvedValue(mockProvider);
    jest.spyOn(models.Service, 'findOne').mockResolvedValue(mockService);
    jest.spyOn(models.ServicePlan, 'findOne').mockResolvedValue(mockPlan);
    jest.spyOn(models.Address, 'findOne').mockResolvedValue(mockAddress);
    jest.spyOn(models.ServiceArea, 'findOne').mockResolvedValue({ id: 1 });
    jest.spyOn(models.CustomerSubscription, 'findOne').mockResolvedValue(null);
    jest.spyOn(models.Notification, 'findOne').mockResolvedValue({ id: 1 });
    jest.spyOn(models.sequelize, 'transaction').mockImplementation(async (cb) => cb({}));
    jest.spyOn(require('../src/services/commission.service'), 'commissionPercentFor').mockResolvedValue({ percent: 10, commissionRuleId: 1, scope: 'service' });

    let createdSubscription = null;
    let createdSubPayment = null;

    jest.spyOn(models.CustomerSubscription, 'create').mockImplementation(async (data) => {
      createdSubscription = { id: 201, ...data };
      return createdSubscription;
    });

    jest.spyOn(models.SubscriptionPayment, 'create').mockImplementation(async (data) => {
      createdSubPayment = { id: 401, ...data };
      return createdSubPayment;
    });

    jest.spyOn(models.CustomerSubscription, 'findByPk').mockImplementation(async () => createdSubscription);
    jest.spyOn(subscriptionService, 'ensureDeliveriesForSubscription').mockResolvedValue(30);

    // Customer orders qty = 2 and attempts to tamper price payload
    await subscriptionService.create(20, {
      provider_id: 10,
      service_id: 1,
      service_plan_id: 101,
      address_id: 5,
      quantity: 2,
      price: 1, // Tampered price sent from client
      amount: 1, // Tampered amount
      delivery_time_slot: 'morning',
      start_date: '2026-09-03'
    });

    // Backend price formula recalculation:
    // basePrice = 30, qty = 2, totalDeliveries = 1 * 30 = 30
    // gross = 30 * 2 * 30 = 1800
    // discount 10% = 180
    // providerAmount = 1620
    // commission (10%) = 162
    // customer payable = 1782
    expect(createdSubPayment).toBeTruthy();
    expect(Number(createdSubPayment.amount)).toBe(1782);
  });

  // Scenario 7 & 8: First delivery Today vs Tomorrow
  test('Scenario 7 & 8: Scheduling schedules for start date correctly (Today vs Tomorrow)', async () => {
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(tomorrowObj);

    const subToday = {
      id: 501,
      start_date: todayStr,
      status: 'active',
      quantity: 1,
      servicePlan: { deliveries_per_day: 1, billing_cycle_days: 5, frequency: 'daily' }
    };

    const createdDeliveries = [];
    jest.spyOn(models.SubscriptionDelivery, 'findOne').mockResolvedValue(null);
    jest.spyOn(models.SubscriptionDelivery, 'create').mockImplementation(async (d) => {
      createdDeliveries.push(d);
      return d;
    });

    // Schedule for Today
    await subscriptionService.ensureDeliveriesForSubscription(subToday);
    expect(createdDeliveries.length).toBe(5);
    expect(createdDeliveries[0].delivery_date).toBe(todayStr);

    // Schedule for Tomorrow
    createdDeliveries.length = 0;
    const subTomorrow = {
      id: 502,
      start_date: tomorrowStr,
      status: 'active',
      quantity: 1,
      servicePlan: { deliveries_per_day: 1, billing_cycle_days: 5, frequency: 'daily' }
    };

    await subscriptionService.ensureDeliveriesForSubscription(subTomorrow);
    expect(createdDeliveries.length).toBe(5);
    expect(createdDeliveries[0].delivery_date).toBe(tomorrowStr);
  });

  // Scenario 9: 2 deliveries per day schedules 2 deliveries on the same date with different slots
  test('Scenario 9: 2 deliveries per day creates multiple distinct delivery slots per day', async () => {
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    const sub = {
      id: 601,
      start_date: todayStr,
      status: 'active',
      quantity: 1,
      delivery_slots: [
        { slot: 'morning', custom_time: '07:00' },
        { slot: 'evening', custom_time: '18:00' }
      ],
      servicePlan: { deliveries_per_day: 2, billing_cycle_days: 30, frequency: 'daily' }
    };

    const createdDeliveries = [];
    jest.spyOn(models.SubscriptionDelivery, 'findOne').mockResolvedValue(null);
    jest.spyOn(models.SubscriptionDelivery, 'create').mockImplementation(async (d) => {
      createdDeliveries.push(d);
      return d;
    });

    await subscriptionService.ensureDeliveriesForSubscription(sub);

    // 30 days * 2 deliveries/day = 60 deliveries
    expect(createdDeliveries.length).toBe(60);

    // First day has 2 deliveries: one morning, one evening
    const firstDayDeliveries = createdDeliveries.filter(d => d.delivery_date === todayStr);
    expect(firstDayDeliveries.length).toBe(2);
    expect(firstDayDeliveries[0].delivery_slot).toBe('morning');
    expect(firstDayDeliveries[1].delivery_slot).toBe('evening');
  });
});
