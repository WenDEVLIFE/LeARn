import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity, 
    View
} from 'react-native';
import { insert, select, uploadFile } from '../../config/functions';

type ModelItem = {
  id?: string;
  name?: string;
  description?: string;
  image?: string | { filename?: string; path?: string; url?: string };
  model?: string | { filename?: string; path?: string };
  activated?: boolean;
  set?: number;
  createdAt?: any;
  updatedAt?: any;
};

export default function ModelScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<any | null>(null);
  const [modelFile, setModelFile] = useState<any | null>(null);
  const [items, setItems] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(false);

  // NEW: modal visibility state
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await select('models', {});
      const rows = res.success && Array.isArray(res.data) ? res.data : [];
      setItems(rows);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }

  // Determine set number: find smallest set with <10 items, else next new set
  function getNextSetNumber(existing: ModelItem[]) {
    const counts: Record<number, number> = {};
    for (const r of existing) {
      const s = Number(r.set || 1);
      counts[s] = (counts[s] || 0) + 1;
    }
    // look for lowest set with <10
    const sets = Object.keys(counts).map(n => Number(n)).sort((a, b) => a - b);
    for (const s of sets) {
      if ((counts[s] || 0) < 10) return s;
    }
    // no sets or all full -> next set
    return sets.length ? Math.max(...sets) + 1 : 1;
  }

  // pick image (photos)
  async function pickImage() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (res.type === 'success') {
      setImageFile({
        uri: res.uri,
        name: res.name || res.uri.split('/').pop(),
        type: res.mimeType || guessMime(res.name)
      });
    }
  }

  // pick 3D model (any file; prefer .gltf .glb .obj)
  async function pickModel() {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (res.type === 'success') {
      setModelFile({
        uri: res.uri,
        name: res.name || res.uri.split('/').pop(),
        type: res.mimeType || 'application/octet-stream'
      });
    }
  }

  function guessMime(name?: string) {
    if (!name) return 'application/octet-stream';
    const ext = name.split('.').pop()?.toLowerCase();
    if (!ext) return 'application/octet-stream';
    if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    return 'application/octet-stream';
  }

  async function handleUpload() {
    if (!name.trim()) return Alert.alert('Validation', 'Please provide a name');
    if (!imageFile) return Alert.alert('Validation', 'Please pick an image');
    if (!modelFile) return Alert.alert('Validation', 'Please pick a 3D model file');

    setLoading(true);
    try {
      // decide set number
      const setNumber = getNextSetNumber(items);

      // upload image to backend assets/images
      const imgRes = await uploadFile(imageFile as any, 'images');
      if (!imgRes.success) throw new Error(imgRes.message || 'Image upload failed');

      // upload 3D model to backend assets/3D
      const modelRes = await uploadFile(modelFile as any, '3D');
      if (!modelRes.success) throw new Error(modelRes.message || 'Model upload failed');

      const imageData = imgRes.data ?? imgRes;
      const modelData = modelRes.data ?? modelRes;

      // insert metadata into Firestore 'models' collection
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: imageData.path ?? imageData.url ?? imageData.filename ?? imageData,
        model: modelData.path ?? modelData.url ?? modelData.filename ?? modelData,
        activated: true,
        set: setNumber
      };

      const insertRes = await insert('models', payload);
      if (!insertRes.success) throw new Error(insertRes.message || 'Insert failed');

      Alert.alert('Success', 'Model uploaded and metadata saved');
      // reset and refresh
      setName('');
      setDescription('');
      setImageFile(null);
      setModelFile(null);
      setShowModal(false); // close modal after success
      await fetchItems();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload error', err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  function renderRow({ item }: { item: ModelItem }) {
    const created = item.createdAt && item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt;
    const updated = item.updatedAt && item.updatedAt.toDate ? item.updatedAt.toDate() : item.updatedAt;
    const imageUri = typeof item.image === 'string' ? item.image : (item.image && (item.image.url || item.image.path)) || null;

    return (
      <View style={styles.tableRow}>
        <View style={[styles.cell, { flex: 1 }]}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.rowThumb} /> : <Text style={styles.cellText}>—</Text>}
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellText}>{item.name}</Text>
        </View>
        <View style={[styles.cell, { flex: 1 }]}>
          <Text style={styles.cellText}>{item.set ?? '-'}</Text>
        </View>
        <View style={[styles.cell, { flex: 1 }]}>
          <Text style={styles.cellText}>{item.activated ? 'Yes' : 'No'}</Text>
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellText} numberOfLines={1}>{typeof item.model === 'string' ? item.model : (item.model && (item.model.filename || item.model.path) )}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Models</Text>

      {/* Button to open modal form */}
      <View style={{ marginBottom: 12 }}>
        <Button title="Upload New Model" onPress={() => setShowModal(true)} />
      </View>

      {/* Modal with the upload form */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.heading, { marginBottom: 8 }]}>Upload Model</Text>

            <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />

            <View style={styles.pickers}>
              <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
                <Text style={styles.pickerText}>{imageFile ? `Image: ${imageFile.name}` : 'Pick Image'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBtn} onPress={pickModel}>
                <Text style={styles.pickerText}>{modelFile ? `Model: ${modelFile.name}` : 'Pick 3D Model'}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => setShowModal(false)} />
              <Button title="Upload" onPress={handleUpload} disabled={loading} />
            </View>

            {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
          </View>
        </View>
      </Modal>

      <Text style={[styles.subHeading, { marginTop: 18, marginBottom: 8 }]}>Existing Models</Text>

      {loading && items.length === 0 ? <ActivityIndicator /> : (
        <View style={styles.table}>
          {/* table header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.cell, { flex: 1 }]}><Text style={[styles.cellText, styles.headerText]}>Thumb</Text></View>
            <View style={[styles.cell, { flex: 2 }]}><Text style={[styles.cellText, styles.headerText]}>Name</Text></View>
            <View style={[styles.cell, { flex: 1 }]}><Text style={[styles.cellText, styles.headerText]}>Set</Text></View>
            <View style={[styles.cell, { flex: 1 }]}><Text style={[styles.cellText, styles.headerText]}>Active</Text></View>
            <View style={[styles.cell, { flex: 2 }]}><Text style={[styles.cellText, styles.headerText]}>3D File</Text></View>
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => i.id ?? Math.random().toString()}
            renderItem={renderRow}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  subHeading: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, backgroundColor: '#fff' },
  pickers: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pickerBtn: { flex: 1, marginHorizontal: 4, padding: 10, backgroundColor: '#f2f2f2', borderRadius: 6, alignItems: 'center' },
  pickerText: { color: '#333' },

  // table styles
  table: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#f7f7f7' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8, paddingHorizontal: 10 },
  cell: { paddingHorizontal: 6, justifyContent: 'center' },
  cellText: { fontSize: 13, color: '#222' },
  headerText: { fontWeight: '700', color: '#333' },
  rowThumb: { width: 60, height: 60, borderRadius: 6, resizeMode: 'cover' },

  // modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 5 },

  // existing
  row: { flexDirection: 'row', padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  thumbWrap: { width: 100, height: 100, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  thumb: { width: 100, height: 100, resizeMode: 'cover', borderRadius: 6 },
  noThumb: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 6 },
  info: { flex: 1 },
  name: { fontWeight: '700' },
  desc: { color: '#555', marginBottom: 6 },
  meta: { fontSize: 11, color: '#666' }
});