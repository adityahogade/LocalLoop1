const STATES = Object.freeze({
  ACTIVE: 'active',
  PAUSED: 'paused',
  VACATION: 'vacation',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

const TRANSITIONS = {
  active: ['paused', 'vacation', 'cancelled', 'expired'],
  paused: ['active', 'vacation', 'cancelled'],
  vacation: ['active', 'cancelled'],
  cancelled: [],
  expired: [],
};

function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const error = new Error(
      `Invalid subscription transition: ${from} -> ${to}`
    );

    error.code = 'INVALID_SUBSCRIPTION_TRANSITION';
    error.statusCode = 422;

    throw error;
  }
}

module.exports = {
  STATES,
  TRANSITIONS,
  canTransition,
  assertTransition,
};