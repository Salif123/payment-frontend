import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { API_URL } from '../config';
import { Customer, Payment } from '../types';

// Helper functions for safe formatting across platforms (Web & Mobile/Hermes)
const safeFormatCurrency = (amount: any): string => {
  if (amount === undefined || amount === null) return '0.00';
  const num = parseFloat(amount.toString());
  if (isNaN(num)) return '0.00';
  try {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (e) {
    return num.toFixed(2);
  }
};

const safeFormatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch (e) {
    console.error('Error parsing date:', e);
  }

  // Regex fallback parser for YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  return dateStr;
};

const safeFormatDateTime = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    }
  } catch (e) {
    console.error('Error parsing datetime:', e);
  }
  return dateStr;
};

export default function CustomerPortal() {
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchError, setSearchError] = useState('');

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Receipt Modal State
  const [receipt, setReceipt] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = async () => {
    if (!accountNumber.trim()) {
      setSearchError('Please enter an account number.');
      return;
    }

    setLoading(true);
    setSearchError('');
    setCustomer(null);
    setPayments([]);

    try {
      // 1. Fetch all customers and filter for the account number
      const customersRes = await fetch(`${API_URL}/customers`);
      if (!customersRes.ok) throw new Error('Failed to retrieve customer database.');
      const allCustomers: Customer[] = await customersRes.json();
      
      const foundCustomer = allCustomers.find(
        (c) => c.account_number.toLowerCase() === accountNumber.trim().toLowerCase()
      );

      if (!foundCustomer) {
        setSearchError('Account number not found. Try ACC001, ACC002, etc.');
        setLoading(false);
        return;
      }

      setCustomer(foundCustomer);
      setPaymentAmount(parseFloat(foundCustomer.emi_due.toString()).toString());

      // 2. Fetch payment history
      const historyRes = await fetch(`${API_URL}/payments/${foundCustomer.account_number}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPayments(historyData);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!customer) return;
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    if (amount > parseFloat(customer.remaining_balance.toString())) {
      setPaymentError(`Amount cannot exceed the remaining balance of ₹${customer.remaining_balance}.`);
      return;
    }

    setPaying(true);
    setPaymentError('');

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: customer.account_number,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed.');
      }

      // Success
      setReceipt(data.receipt);
      setModalVisible(true);

      // Refresh customer and history
      await refreshCustomerData();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment submission failed.');
    } finally {
      setPaying(false);
    }
  };

  const refreshCustomerData = async () => {
    if (!customer) return;
    try {
      // Refresh customer details
      const customersRes = await fetch(`${API_URL}/customers`);
      const allCustomers: Customer[] = await customersRes.json();
      const updated = allCustomers.find((c) => c.id === customer.id);
      if (updated) {
        setCustomer(updated);
        setPaymentAmount(parseFloat(updated.emi_due.toString()).toString());
      }

      // Refresh history
      const historyRes = await fetch(`${API_URL}/payments/${customer.account_number}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPayments(historyData);
      }
    } catch (e) {
      console.error('Error refreshing details:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    return safeFormatDate(dateStr);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.bannerTitle}>Self-Service Portal</Text>
        <Text style={styles.bannerSubtitle}>Pay your EMI instantly and securely</Text>
      </View>

      {/* Account Lookup Section */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Access Your Loan Account</Text>
        <Text style={styles.label}>Enter Account Number</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. ACC001"
            value={accountNumber}
            onChangeText={setAccountNumber}
            autoCapitalize="characters"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
        {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
      </View>

      {customer && (
        <>
          {/* Loan Details Card */}
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <Text style={styles.cardHeading}>Personal Loan Details</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>
                  {parseFloat(customer.remaining_balance.toString()) > 0 ? 'Active' : 'Closed'}
                </Text>
              </View>
            </View>

            <View style={styles.customerHeader}>
              <Text style={styles.customerName}>{customer.customer_name}</Text>
              <Text style={styles.customerAccountNumber}>{customer.account_number}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Issue Date</Text>
                <Text style={styles.gridValue}>{formatDate(customer.issue_date)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Interest Rate</Text>
                <Text style={styles.gridValue}>{customer.interest_rate}% p.a.</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Tenure</Text>
                <Text style={styles.gridValue}>{customer.tenure} Months</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>EMI Due</Text>
                <Text style={styles.gridValueHighlighted}>₹{safeFormatCurrency(customer.emi_due)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Remaining Loan Balance</Text>
              <Text style={styles.balanceValue}>₹{safeFormatCurrency(customer.remaining_balance)}</Text>
            </View>
          </View>

          {/* Payment Submission Card */}
          {parseFloat(customer.remaining_balance.toString()) > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Make a Payment</Text>
              <Text style={styles.label}>Enter Payment Amount (₹)</Text>
              <TextInput
                style={styles.paymentInput}
                keyboardType="decimal-pad"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="0.00"
              />
              {paymentError ? <Text style={styles.errorText}>{paymentError}</Text> : null}

              <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={paying}>
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payButtonText}>Submit Payment of ₹{paymentAmount || '0'}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Payment History Log */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Account Payment History</Text>
            <View style={styles.divider} />

            {payments.length === 0 ? (
              <Text style={styles.noHistoryText}>No payments logged yet for this account.</Text>
            ) : (
              payments.map((p) => (
                <View key={p.id} style={styles.paymentLogItem}>
                  <View>
                    <Text style={styles.logTxnId}>{p.transaction_id}</Text>
                    <Text style={styles.logDate}>{safeFormatDateTime(p.payment_date)}</Text>
                  </View>
                  <View style={styles.logRight}>
                    <Text style={styles.logAmount}>+ ₹{safeFormatCurrency(p.payment_amount)}</Text>
                    <View style={styles.successBadge}>
                      <Text style={styles.successBadgeText}>{p.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.modalTitle}>Payment Successful</Text>
            <Text style={styles.modalSubtitle}>Your transaction has been processed.</Text>

            {receipt && (
              <View style={styles.receiptContainer}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction ID</Text>
                  <Text style={styles.receiptVal}>{receipt.transaction_id}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Account Number</Text>
                  <Text style={styles.receiptVal}>{receipt.account_number}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Customer Name</Text>
                  <Text style={styles.receiptVal}>{receipt.customer_name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount Paid</Text>
                  <Text style={styles.receiptValAmount}>₹{safeFormatCurrency(receipt.payment_amount)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Remaining Balance</Text>
                  <Text style={styles.receiptVal}>₹{safeFormatCurrency(receipt.remaining_balance)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <Text style={styles.statusReceiptText}>{receipt.status}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f6f9fc',
    minHeight: '100%',
  },
  headerBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadgeText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    marginRight: 10,
    outlineStyle: 'none',
  } as any,
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  customerHeader: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  customerAccountNumber: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  gridValueHighlighted: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e11d48',
  },
  balanceContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  paymentInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    outlineStyle: 'none',
  } as any,
  payButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
  },
  noHistoryText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 12,
  },
  paymentLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logTxnId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  logDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 4,
  },
  successBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  successBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 20,
    ...Platform.select({
      web: {
        cursor: 'default',
      },
    }),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    color: '#10b981',
    fontSize: 32,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  receiptContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  receiptValAmount: {
    fontSize: 15,
    color: '#16a34a',
    fontWeight: '800',
  },
  statusReceiptText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 13,
  },
  closeModalButton: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
