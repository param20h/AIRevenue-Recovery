export type FailureReason = 
  | 'bank_timeout'
  | 'insufficient_funds'
  | 'gateway_error'
  | 'card_declined'
  | '3ds_failure'
  | 'abandoned_checkout'
  | 'unknown';

export type ActionType = 
  | 'AUTO_RETRY'
  | 'SMART_PAYMENT_LINK'
  | 'WHATSAPP_REMINDER'
  | 'ESCALATE_TO_HUMAN'
  | 'NO_ACTION';

export type PipelineType = 'payment' | 'receivables';

export interface GuardrailResult {
  passed: boolean;
  rule: string;
  reason?: string;
}

export interface CustomerContext {
  id: string;
  optOut: boolean;
  priorSuccessfulPayments: number;
  lastContactAt: Date | null;
  dailyContactCount: number;
  contactCountResetAt: Date | null;
}

export interface TransactionContext {
  id: string;
  amount: number;
  failureReason: FailureReason;
  attemptCount: number; // calculated from audit log
}
