import { CustomerContext, TransactionContext, GuardrailResult, ActionType } from './types';

export function runGuardrails(
  customer: CustomerContext,
  tx: TransactionContext,
  proposedAction: ActionType,
  proposedDiscount: number = 0
): GuardrailResult[] {
  const results: GuardrailResult[] = [];
  const now = new Date();

  // 1. Max retries per transaction
  if (tx.attemptCount >= 3) {
    results.push({
      passed: false,
      rule: 'MAX_RETRIES',
      reason: `3 attempts already made for transaction ${tx.id}`
    });
  } else {
    results.push({ passed: true, rule: 'MAX_RETRIES' });
  }

  // 2. 24-hour contact cooldown (Only applies to contact actions, not silent auto-retries)
  const isContactAction = proposedAction === 'SMART_PAYMENT_LINK' || proposedAction === 'WHATSAPP_REMINDER';
  
  if (isContactAction && customer.lastContactAt) {
    const hoursSinceContact = (now.getTime() - customer.lastContactAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceContact < 24) {
      results.push({
        passed: false,
        rule: 'CONTACT_COOLDOWN',
        reason: `Customer contacted ${hoursSinceContact.toFixed(1)} hours ago (requires 24h)`
      });
    } else {
      results.push({ passed: true, rule: 'CONTACT_COOLDOWN' });
    }
  } else {
    results.push({ passed: true, rule: 'CONTACT_COOLDOWN' });
  }

  // 3. Opt-out flag
  if (customer.optOut) {
    results.push({
      passed: false,
      rule: 'OPT_OUT',
      reason: 'Customer has permanently opted out of recovery communications'
    });
  } else {
    results.push({ passed: true, rule: 'OPT_OUT' });
  }

  // 4. Discount/incentive cap
  if (proposedDiscount > 10) {
    results.push({
      passed: false,
      rule: 'DISCOUNT_CAP',
      reason: `Proposed discount ${proposedDiscount}% exceeds 10% cap`
    });
  } else {
    results.push({ passed: true, rule: 'DISCOUNT_CAP' });
  }

  // 5. Global daily contact cap
  if (isContactAction) {
    const isSameDay = customer.contactCountResetAt && 
      customer.contactCountResetAt.toDateString() === now.toDateString();
    const countToday = isSameDay ? customer.dailyContactCount : 0;
    
    if (countToday >= 2) {
      results.push({
        passed: false,
        rule: 'DAILY_CONTACT_CAP',
        reason: `Daily contact cap (2) reached for customer ${customer.id}`
      });
    } else {
      results.push({ passed: true, rule: 'DAILY_CONTACT_CAP' });
    }
  } else {
    results.push({ passed: true, rule: 'DAILY_CONTACT_CAP' });
  }

  return results;
}
