import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CookProfileScreen() {
  const router = useRouter();
  const [cook, setCook] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, rating: 0, reviews: 0 });

  useEffect(() => {
    loadCook();
  }, []);

  const loadCook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cookData } = await supabase.from('cooks').select('*').eq('user_id', user.id).single();
    if (!cookData) return;
    setCook(cookData);

    const { data: orders } = await supabase.from('orders').select('total, status').eq('cook_id', cookData.id);
    if (orders) {
      const completed = orders.filter(o => o.status === 'picked_up');
      const revenue = completed.reduce((s, o) => s + (o.total || 0), 0);
      setStats({ orders: orders.length, revenue, rating: cookData.rating || 0, reviews: 0 });
    }

    const { count } = await supabase.from('reviews').select('*', { count: 'exact' }).eq('cook_id', cookData.id);
    setStats(prev => ({ ...prev, reviews: count || 0 }));
  };

  const toggleOpen = async () => {
    if (!cook) return;
    const newStatus = !cook.is_open;
    await supabase.from('cooks').update({ is_open: newStatus }).eq('id', cook.id);
    setCook({ ...cook, is_open: newStatus });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>👨‍🍳 My Kitchen</Text>
            <Text style={styles.headerSub}>{cook?.name || 'Loading...'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusToggle, { backgroundColor: cook?.is_open ? '#2E7D52' : '#8899BB' }]}
            onPress={toggleOpen}>
            <Text style={styles.statusToggleText}>{cook?.is_open ? '🟢 Open' : '🔴 Closed'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          {[
            [stats.orders.toString(), 'ORDERS'],
            ['$' + stats.revenue.toFixed(0), 'REVENUE'],
            [stats.rating.toString(), 'RATING'],
            [stats.reviews.toString(), 'REVIEWS'],
          ].map(([num, label], i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statNum}>{num}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KITCHEN INFO</Text>
          <View style={styles.card}>
            {[
              { icon: '🏡', label: 'Location', value: cook?.city || '—' },
              { icon: '🕐', label: 'Pickup Hours', value: cook?.pickup_start && cook?.pickup_end ? `${cook.pickup_start} - ${cook.pickup_end}` : '—' },
              { icon: '⭐', label: 'Rating', value: cook?.rating ? `${cook.rating} / 5` : '—' },
            ].map((item, i) => (
              <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.infoRow}>
              <Text style={styles.infoIcon}>✏️</Text>
              <Text style={styles.infoLabel}>Edit Profile</Text>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoIcon}>💳</Text>
              <Text style={styles.infoLabel}>Payout Settings</Text>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoIcon}>❓</Text>
              <Text style={styles.infoLabel}>Help & Support</Text>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B2B4B', padding: 20, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#8899BB', marginTop: 2 },
  statusToggle: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  statusToggleText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#8899BB', fontSize: 9, marginTop: 2, letterSpacing: 0.5 },
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#8899BB', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#1B2B4B', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: '#F0F4FF' },
  infoIcon: { fontSize: 18, width: 28 },
  infoLabel: { flex: 1, fontSize: 14, color: '#1B2B4B', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#8899BB' },
  infoArrow: { fontSize: 18, color: '#8899BB' },
  logoutBtn: { marginHorizontal: 20, marginTop: 20, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E8F0' },
  logoutBtnText: { color: '#1B2B4B', fontSize: 14, fontWeight: '600' },
});