import { FailureReason, CustomerContext, TransactionContext } from './types';

export function calculateScore(
  tx: TransactionContext,
  customer: CustomerContext
): number {
  let score = 0;

  // 1. Failure Reason (40%)
  switch (tx.failureReason) {
    case 'bank_timeout':
      score += 40;
      break;
    case 'gateway_error':
      score += 35;
      break;
    case '3ds_failure':
      score += 20;
      break;
    case 'card_declined':
      score += 15;
      break;
    case 'insufficient_funds':
      score += 0;
      break;
    case 'abandoned_checkout':
      score += 10;
      break;
    default:
      score += 0;
  }

  // 2. Customer payment history (30%)
  if (customer.priorSuccessfulPayments > 5) {
    score += 30;
  } else if (customer.priorSuccessfulPayments >= 2) {
    score += 20;
  } else {
    score += 5;
  }

  // 3. Attempt count on this tx (20%)
  if (tx.attemptCount === 0) {
    score += 20;
  } else if (tx.attemptCount === 1) {
    score += 12;
  } else if (tx.attemptCount === 2) {
    score += 5;
  } else {
    score += 0; // Cap hit
  }

  // Cap at 100
  return Math.min(score, 100);
}
