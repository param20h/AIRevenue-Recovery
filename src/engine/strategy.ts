import { ActionType, FailureReason } from './types';

export function selectStrategy(
  score: number,
  failureReason: FailureReason,
  attemptCount: number,
  amount: number
): ActionType {
  // If we've hit max attempts in the state machine (though guardrail acts as the hard block)
  if (attemptCount >= 3 || score < 40) {
    return 'NO_ACTION';
  }

  if (failureReason === 'abandoned_checkout') {
    return 'WHATSAPP_REMINDER';
  }

  // High probability + technical failure
  if (score >= 70 && (failureReason === 'bank_timeout' || failureReason === 'gateway_error')) {
    return 'AUTO_RETRY';
  }

  // Medium probability or card-level failure
  return 'SMART_PAYMENT_LINK';
}
