export interface Customer {
  id: number;
  account_number: string;
  customer_name: string;
  issue_date: string;
  interest_rate: number | string;
  tenure: number;
  emi_due: number | string;
  remaining_balance: number | string;
  created_at?: string;
}

export interface Payment {
  id: number;
  customer_id: number;
  payment_date: string;
  payment_amount: number | string;
  status: string;
  transaction_id: string;
}
