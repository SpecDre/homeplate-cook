import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cookId, setCookId] = useState<string | null>(null);
  const [cookName, setCookName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCookAndOrders();
    }, [])
  );

  const loadCookAndOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cook } = await supabase.from('cooks').select('id, name, is_open').eq('user_id', user.id).single();
    if (!cook) return;
    setCookId(cook.id);
    setCookName(cook.name);
    setIsOpen(cook.is_open);
    const { data } = await supabase.from('orders').select('*').eq('cook_id', cook.id).order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCookAndOrders();
    setRefreshing(false);
  };

  const toggleOpen = async () => {
    if (!cookId) return;
    const newStatus = !isOpen;
    await supabase.from('cooks').update({ is_open: newStatus }).eq('id', cookId);
    setIsOpen(newStatus);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const statusConfig: { [key: string]: { bg: string; color: string; label: string; next: string | null; nextLabel: string | null } } = {
    paid: { bg: '#FEF3C7', color: '#92400E', label: '🆕 New Order', next: 'preparing', nextLabel: 'Start Preparing' },
    preparing: { bg: '#DBEAFE', color: '#1E40AF', label: '👨‍🍳 Preparing', next: 'ready', nextLabel: 'Mark Ready' },
    ready: { bg: '#D1FAE5', color: '#065F46', label: '✅ Ready', next: 'picked_up', nextLabel: 'Mark Picked Up' },
    picked_up: { bg: '#F3F4F6', color: '#6B7280', label: '🎉 Picked Up', next: null, nextLabel: null },
  };

  const activeOrders = orders.filter(o => o.status !== 'picked_up');
  const completedOrders = orders.filter(o => o.status === 'picked_up');
  const todayRevenue = completedOrders
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + (o.total || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📦 Orders</Text>
          <Text style={styles.headerSub}>{cookName || 'Your Kitchen'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusToggle, { backgroundColor: isOpen ? '#2E7D52' : '#64748B' }]}
          onPress={toggleOpen}>
          <Text style={styles.statusToggleText}>{isOpen ? '🟢 Open' : '🔴 Closed'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>ACTIVE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{completedOrders.length}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>${todayRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>TODAY</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D52" />}>
        {loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Loading orders...</Text>
          </View>
        ) : activeOrders.length === 0 && completedOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Pull down to refresh</Text>
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ACTIVE ORDERS</Text>
                {activeOrders.map((order, i) => {
                  const config = statusConfig[order.status] || statusConfig['paid'];
                  return (
                    <View key={i} style={styles.orderCard}>
                      <View style={styles.orderTop}>
                        <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
                          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                        <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      {Array.isArray(order.items) && (
                        <View style={styles.itemsList}>
                          {order.items.map((item: any, j: number) => (
                            <Text key={j} style={styles.itemRow}>• {item.name} × {item.qty}</Text>
                          ))}
                        </View>
                      )}
                      <View style={styles.orderFooter}>
                        <Text style={styles.orderTotal}>${Number(order.total).toFixed(2)}</Text>
                        {config.next && (
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => updateStatus(order.id, config.next!)}>
                            <Text style={styles.actionBtnText}>{config.nextLabel}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {completedOrders.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>COMPLETED</Text>
                {completedOrders.map((order, i) => (
                  <View key={i} style={[styles.orderCard, styles.orderCardDone]}>
                    <View style={styles.orderTop}>
                      <View style={[styles.statusPill, { backgroundColor: '#F3F4F6' }]}>
                        <Text style={[styles.statusText, { color: '#6B7280' }]}>🎉 Picked Up</Text>
                      </View>
                      <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleDateString()}</Text>
                    </View>
                    {Array.isArray(order.items) && (
                      <View style={styles.itemsList}>
                        {order.items.map((item: any, j: number) => (
                          <Text key={j} style={styles.itemRow}>• {item.name} × {item.qty}</Text>
                        ))}
                      </View>
                    )}
                    <Text style={styles.orderTotal}>${Number(order.total).toFixed(2)}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B2B4B', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#8899BB', marginTop: 2 },
  statusToggle: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  statusToggleText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsBar: { backgroundColor: '#243454', flexDirection: 'row', paddingVertical: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 9, color: '#8899BB', marginTop: 2, letterSpacing: 1 },
  statDivider: { width: 1, backgroundColor: '#2E4070' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#8899BB', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  emptyBox: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1B2B4B', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#8899BB', marginBottom: 4 },
  orderCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#1B2B4B', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  orderCardDone: { opacity: 0.7 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderTime: { fontSize: 12, color: '#8899BB' },
  itemsList: { marginBottom: 12 },
  itemRow: { fontSize: 13, color: '#1B2B4B', marginBottom: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: 16, fontWeight: '700', color: '#1B2B4B' },
  actionBtn: { backgroundColor: '#2E7D52', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});