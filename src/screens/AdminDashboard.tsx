import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
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

export default function AdminDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    activeLoans: 0,
    closedLoans: 0,
  });

  // Customer Detail Modal States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/customers`);
      if (!response.ok) throw new Error('Failed to retrieve customer portfolio.');
      const data: Customer[] = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
      calculateStats(data);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const calculateStats = (data: Customer[]) => {
    let outstanding = 0;
    let active = 0;
    let closed = 0;

    data.forEach((c) => {
      const bal = parseFloat(c.remaining_balance.toString());
      outstanding += bal;
      if (bal > 0) active++;
      else closed++;
    });

    setStats({
      totalOutstanding: outstanding,
      activeLoans: active,
      closedLoans: closed,
    });
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(text.toLowerCase()) ||
        c.account_number.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
    setLoadingPayments(true);
    setCustomerPayments([]);

    try {
      const response = await fetch(`${API_URL}/payments/${customer.account_number}`);
      if (response.ok) {
        const paymentsData = await response.json();
        setCustomerPayments(paymentsData);
      }
    } catch (err) {
      console.error('Error fetching payments in modal:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return safeFormatDate(dateStr);
  };

  return (
    <View style={styles.container}>
      {/* Metric Cards Banner */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: '#6366f1' }]}>
          <Text style={styles.metricLabel}>Total Portfolio Balance</Text>
          <Text style={styles.metricVal}>₹{safeFormatCurrency(stats.totalOutstanding)}</Text>
        </View>
        <View style={styles.metricsHalfRow}>
          <View style={[styles.metricCardHalf, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.metricLabelHalf}>Active Accounts</Text>
            <Text style={styles.metricValHalf}>{stats.activeLoans}</Text>
          </View>
          <View style={[styles.metricCardHalf, { backgroundColor: '#10b981' }]}>
            <Text style={styles.metricLabelHalf}>Closed Loans</Text>
            <Text style={styles.metricValHalf}>{stats.closedLoans}</Text>
          </View>
        </View>
      </View>

      {/* Search and Refresh Section */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Filter by name or account number..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.refreshButton} onPress={fetchCustomers}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Main Customers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Fetching loan records...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCustomers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.customerItem}
              onPress={() => handleCustomerSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemName}>{item.customer_name}</Text>
                  <Text style={styles.itemAccountNumber}>{item.account_number}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemBalance}>₹{safeFormatCurrency(item.remaining_balance)}</Text>
                  <Text style={styles.itemEmi}>EMI: ₹{safeFormatCurrency(item.emi_due)}</Text>
                </View>
              </View>
              <View style={styles.itemFooter}>
                <Text style={styles.itemMeta}>Interest: {item.interest_rate}% | Tenure: {item.tenure}M</Text>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        parseFloat(item.remaining_balance.toString()) > 0 ? '#eff6ff' : '#dcfce7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusIndicatorText,
                      {
                        color: parseFloat(item.remaining_balance.toString()) > 0 ? '#2563eb' : '#15803d',
                      },
                    ]}
                  >
                    {parseFloat(item.remaining_balance.toString()) > 0 ? 'Active' : 'Settled'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No customers found matching search criteria.</Text>
          }
        />
      )}

      {/* Customer Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCustomer && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedCustomer.customer_name}</Text>
                    <Text style={styles.modalSubtitle}>Account: {selectedCustomer.account_number}</Text>
                  </View>
                  <TouchableOpacity style={styles.closeModalButtonX} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeModalButtonXText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalScroll} 
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Detailed Information Grid */}
                  <Text style={styles.sectionTitle}>Loan Agreement Summary</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoGridRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Disbursal Date</Text>
                        <Text style={styles.infoValue}>{formatDate(selectedCustomer.issue_date)}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Interest Rate</Text>
                        <Text style={styles.infoValue}>{selectedCustomer.interest_rate}% p.a.</Text>
                      </View>
                    </View>
                    <View style={styles.infoGridRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Original Tenure</Text>
                        <Text style={styles.infoValue}>{selectedCustomer.tenure} Months</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Monthly EMI Due</Text>
                        <Text style={styles.infoValue}>₹{safeFormatCurrency(selectedCustomer.emi_due)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.balanceHighlight}>
                    <View>
                      <Text style={styles.balanceHighlightLabel}>Remaining Outstanding</Text>
                      <Text style={styles.balanceHighlightValue}>₹{safeFormatCurrency(selectedCustomer.remaining_balance)}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            parseFloat(selectedCustomer.remaining_balance.toString()) > 0
                              ? '#dbeafe'
                              : '#dcfce7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              parseFloat(selectedCustomer.remaining_balance.toString()) > 0
                                ? '#1e40af'
                                : '#15803d',
                          },
                        ]}
                      >
                        {parseFloat(selectedCustomer.remaining_balance.toString()) > 0
                          ? 'Active'
                          : 'Fully Settled'}
                      </Text>
                    </View>
                  </View>

                  {/* Payment History */}
                  <Text style={styles.sectionTitle}>Payment Log Details</Text>
                  <View style={styles.historyContainer}>
                    {loadingPayments ? (
                      <ActivityIndicator size="small" color="#6366f1" style={{ padding: 20 }} />
                    ) : customerPayments.length === 0 ? (
                      <Text style={styles.noHistoryText}>No transactions recorded on this account.</Text>
                    ) : (
                      customerPayments.map((p) => (
                        <View key={p.id} style={styles.historyItem}>
                          <View>
                            <Text style={styles.historyTxn}>{p.transaction_id}</Text>
                            <Text style={styles.historyDate}>
                              {safeFormatDateTime(p.payment_date)}
                            </Text>
                          </View>
                          <View style={styles.historyRight}>
                            <Text style={styles.historyAmount}>+ ₹{safeFormatCurrency(p.payment_amount)}</Text>
                            <Text style={styles.historyStatus}>{p.status}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f9fc',
  },
  metricsGrid: {
    marginBottom: 20,
  },
  metricCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricVal: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  metricsHalfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -5,
  },
  metricCardHalf: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricLabelHalf: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValHalf: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    height: 46,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    outlineStyle: 'none',
  } as any,
  refreshButton: {
    width: 46,
    height: 46,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: Platform.OS === 'web' ? 38 : 22,
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  customerItem: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemAccountNumber: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
  },
  itemEmi: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  itemMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    height: Platform.OS === 'web' ? 'auto' : Dimensions.get('window').height * 0.75,
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  closeModalButtonX: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonXText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  balanceHighlight: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceHighlightLabel: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceHighlightValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4338ca',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    marginBottom: 10,
  },
  noHistoryText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyTxn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  historyDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  historyStatus: {
    fontSize: 9,
    color: '#16a34a',
    fontWeight: '700',
    marginTop: 2,
  },
});
