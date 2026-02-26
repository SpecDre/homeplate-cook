import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cookId, setCookId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [ingredients, setIngredients] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const ALLERGENS = ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish'];
  const SPICE_LEVELS = ['None', '🌶️', '🌶️🌶️', '🌶️🌶️🌶️'];

  useFocusEffect(
    useCallback(() => {
      loadMenu();
    }, [])
  );

  const loadMenu = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cook } = await supabase.from('cooks').select('id').eq('user_id', user.id).single();
    if (!cook) return;
    setCookId(cook.id);
    const { data } = await supabase.from('menu_items').select('*').eq('cook_id', cook.id).order('created_at');
    if (data) setMenuItems(data);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const filename = `${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(filename, formData, { contentType: 'multipart/form-data' });

      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(filename);
      return publicUrl;
    } catch (err) {
      console.log('Upload error:', err);
      return null;
    }
  };

  const openAdd = () => {
    setEditing(null);
    setName(''); setDescription(''); setPrice(''); setEmoji('🍽️');
    setIngredients(''); setAllergens([]); setSpiceLevel(0); setImageUri(null);
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setName(item.name); setDescription(item.description || ''); setPrice(String(item.price));
    setEmoji(item.emoji || '🍽️'); setIngredients(item.ingredients || '');
    setAllergens(item.allergens || []); setSpiceLevel(item.spice_level || 0);
    setImageUri(item.image_url || null);
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!name || !price || !cookId) return;
    setUploading(true);
    try {
      let imageUrl = editing?.image_url || null;
      if (imageUri && imageUri !== editing?.image_url) {
        imageUrl = await uploadImage(imageUri);
      }
      const payload = {
        cook_id: cookId,
        name,
        description,
        price: parseFloat(price),
        emoji,
        ingredients,
        allergens,
        spice_level: spiceLevel,
        image_url: imageUrl,
      };
      if (editing) {
        await supabase.from('menu_items').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('menu_items').insert(payload);
      }
      setShowModal(false);
      loadMenu();
    } catch (err) {
      Alert.alert('Error', 'Could not save item');
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('menu_items').delete().eq('id', id);
        loadMenu();
      }},
    ]);
  };

  const toggleAllergen = (a: string) => {
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽️ Menu</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {menuItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No menu items yet</Text>
            <Text style={styles.emptyText}>Tap + Add to create your first dish</Text>
          </View>
        ) : (
          menuItems.map((item, i) => (
            <View key={i} style={styles.menuCard}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.menuImage} />
              ) : (
                <View style={styles.menuIcon}>
                  <Text style={{ fontSize: 32 }}>{item.emoji || '🍽️'}</Text>
                </View>
              )}
              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuDesc} numberOfLines={1}>{item.description}</Text>
                {item.allergens?.length > 0 && (
                  <Text style={styles.menuAllergens}>⚠️ {item.allergens.join(', ')}</Text>
                )}
                <Text style={styles.menuPrice}>${Number(item.price).toFixed(2)}</Text>
              </View>
              <View style={styles.menuBtns}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(item.id)}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

<Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Item' : 'New Menu Item'}</Text>

              {/* Photo */}
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={{ fontSize: 32 }}>📷</Text>
                    <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.modalLabel}>EMOJI</Text>
              <TextInput style={styles.modalInput} value={emoji} onChangeText={setEmoji} />

              <Text style={styles.modalLabel}>NAME</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. BBQ Brisket" placeholderTextColor="#6B7A99" value={name} onChangeText={setName} />

              <Text style={styles.modalLabel}>DESCRIPTION</Text>
              <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} placeholder="What's in this dish?" placeholderTextColor="#6B7A99" value={description} onChangeText={setDescription} multiline />

              <Text style={styles.modalLabel}>INGREDIENTS</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. Beef, BBQ sauce, spices" placeholderTextColor="#6B7A99" value={ingredients} onChangeText={setIngredients} />

              <Text style={styles.modalLabel}>ALLERGENS</Text>
              <View style={styles.tagsRow}>
                {ALLERGENS.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.tag, allergens.includes(a) && styles.tagActive]}
                    onPress={() => toggleAllergen(a)}>
                    <Text style={[styles.tagText, allergens.includes(a) && styles.tagTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>SPICE LEVEL</Text>
              <View style={styles.tagsRow}>
                {SPICE_LEVELS.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.tag, spiceLevel === idx && styles.tagActive]}
                    onPress={() => setSpiceLevel(idx)}>
                    <Text style={[styles.tagText, spiceLevel === idx && styles.tagTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>PRICE ($)</Text>
              <TextInput style={styles.modalInput} placeholder="0.00" placeholderTextColor="#6B7A99" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, uploading && { opacity: 0.6 }]} onPress={saveItem} disabled={uploading}>
                  <Text style={styles.saveBtnText}>{uploading ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1B2B4B', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#2E7D52', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyBox: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1B2B4B', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#8899BB' },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#1B2B4B', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuImage: { width: 60, height: 60, borderRadius: 14 },
  menuIcon: { width: 60, height: 60, backgroundColor: '#F0F4FF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 15, fontWeight: '700', color: '#1B2B4B' },
  menuDesc: { fontSize: 12, color: '#8899BB', marginTop: 2 },
  menuAllergens: { fontSize: 11, color: '#B07800', marginTop: 2 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: '#2E7D52', marginTop: 4 },
  menuBtns: { gap: 8 },
  editBtn: { width: 34, height: 34, backgroundColor: '#F0F4FF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 16 },
  deleteBtn: { width: 34, height: 34, backgroundColor: '#FFF0F0', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#F5F7FA', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 60 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1B2B4B', marginBottom: 20 },
  photoBtn: { marginBottom: 20 },
  photoPreview: { width: '100%', height: 180, borderRadius: 16 },
  photoPlaceholder: { width: '100%', height: 180, backgroundColor: '#E0E8F0', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C0D0E0', borderStyle: 'dashed' },
  photoPlaceholderText: { color: '#8899BB', fontSize: 14, marginTop: 8 },
  modalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#8899BB', marginBottom: 8 },
  modalInput: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, color: '#1B2B4B', borderWidth: 1.5, borderColor: '#E0E8F0', marginBottom: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E8F0' },
  tagActive: { backgroundColor: '#1B2B4B', borderColor: '#1B2B4B' },
  tagText: { color: '#8899BB', fontSize: 12, fontWeight: '600' },
  tagTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E8F0' },
  cancelBtnText: { color: '#8899BB', fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#2E7D52' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});