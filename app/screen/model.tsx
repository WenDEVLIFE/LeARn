import * as DocumentPicker from 'expo-document-picker';
import { getDownloadURL, getStorage, ref as storageRef } from 'firebase/storage'; // added
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { app } from '../../config/firebaseConfig'; // added
import { insert, remove, select, update, uploadFile } from '../../config/functions'; // added

type ModelItem = {
  id?: string;
  name?: string;
  description?: string;
  image?: string | { filename?: string; path?: string; url?: string };
  model?: string | { filename?: string; path?: string };
  audio?: string | { filename?: string; path?: string; url?: string };
  activated?: boolean;
  category?: string;
  additionalInfo?: { key: string; value: string }[]; // added
  createdAt?: any;
  updatedAt?: any;
};

export default function ModelScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<any | null>(null);
  const [modelFile, setModelFile] = useState<any | null>(null);
  const [audioFile, setAudioFile] = useState<any | null>(null);
  const [items, setItems] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [editingItem, setEditingItem] = useState<ModelItem | null>(null); // added
  const [imageUrls, setImageUrls] = useState<Record<string,string>>({}); // cache for resolved storage paths

  // new states for category + additional info
  const categories = ['all', 'animals', 'fruits', 'vehicles', 'shapes', 'color'];
  const [category, setCategory] = useState<string>(categories[1]);
  const [additionalInfo, setAdditionalInfo] = useState<{ key: string; value: string }[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoKey, setInfoKey] = useState('');
  const [infoValue, setInfoValue] = useState('');

  // datatable controls
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<'all'|'active'|'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name'|'category'|'createdAt'|'activated'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await select('models', {});
      const rows = res.success && Array.isArray(res.data) ? res.data : [];
      setItems(rows);
      // Resolve any storage paths to URLs
      resolveImageUrls(rows);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }

  // resolve image string paths to download URLs
  async function resolveImageUrls(rows: ModelItem[]) {
    const s = getStorage(app);
    const toResolve: [string,string][] = []; // [id, path]
    const next: Record<string,string> = {};
    rows.forEach(r => {
      if (!r.id) return;
      const img = r.image;
      if (typeof img === 'string') {
        if (img.startsWith('http')) {
          next[r.id!] = img;
        } else {
          toResolve.push([r.id!, img]);
        }
      } else if (img && typeof img === 'object') {
        const url = (img as any).url;
        if (url) next[r.id!] = url;
        else if ((img as any).path) toResolve.push([r.id!, (img as any).path]);
      }
    });
    // set known urls first
    setImageUrls(prev => ({ ...prev, ...next }));
    // resolve remaining
    await Promise.all(toResolve.map(async ([id, path]) => {
      try {
        const url = await getDownloadURL(storageRef(s, path));
        setImageUrls(prev => ({ ...prev, [id]: url }));
      } catch (e) {
        console.warn('Failed to resolve image path', path, e);
      }
    }));
  }

  // 🌐 Unified file picker (web + native)
  async function pickFile(type: string) {
    if (Platform.OS === 'web') {
      return new Promise<any>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type;
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return resolve(null);
          const uri = URL.createObjectURL(file);
          resolve({
            uri,
            name: file.name,
            type: file.type,
            file, // needed for web uploads
          });
        };
        input.click();
      });
    } else {
      const res = await DocumentPicker.getDocumentAsync({
        type,
        copyToCacheDirectory: true,
      });
   if (res.canceled) return null; // ✅ correct property
  const asset = res.assets?.[0];
  if (!asset) return null;

  return {
    uri: asset.uri,
    name: asset.name || asset.uri.split('/').pop(),
    type: asset.mimeType || 'application/octet-stream',
  };
    }
  }

  async function pickImage() {
    const file = await pickFile('image/*');
    if (file) setImageFile(file);
  }

  async function pickModel() {
    const file = await pickFile('*/*');
    if (file) setModelFile(file);
  }

  async function pickAudio() {
    const file = await pickFile('audio/*');
    if (file) setAudioFile(file);
  }

  async function handleUpload() {
    if (!name.trim()) return Alert.alert('Validation', 'Please provide a name');
    if (!imageFile && !editingItem) return Alert.alert('Validation', 'Please pick an image');
    if (!modelFile && !editingItem) return Alert.alert('Validation', 'Please pick a 3D model file');

    setLoading(true);
    try {
      // upload image (only if new image picked)
      let imageData: any = editingItem?.image;
      if (imageFile) {
        const imgRes = await uploadFile(imageFile, 'images');
        if (!imgRes.success) throw new Error(imgRes.message || 'Image upload failed');
        imageData = imgRes.data ?? imgRes;
        // ensure we store object with url+path
        imageData = {
          filename: imageData.filename,
          path: imageData.path,
          url: imageData.url
        };
      }

      // upload 3D model (only if new model picked)
      let modelData: any = editingItem?.model;
      if (modelFile) {
        const modelRes = await uploadFile(modelFile, '3D');
        if (!modelRes.success) throw new Error(modelRes.message || 'Model upload failed');
        modelData = modelRes.data ?? modelRes;
        modelData = {
          filename: modelData.filename,
          path: modelData.path,
          url: modelData.url
        };
      }

      let audioData: any = editingItem?.audio ?? null;
      if (audioFile) {
        const audioRes = await uploadFile(audioFile, 'audio');
        if (!audioRes.success) throw new Error(audioRes.message || 'Audio upload failed');
        audioData = audioRes.data ?? audioRes;
        audioData = {
          filename: audioData.filename,
          path: audioData.path,
          url: audioData.url
        };
      }

      const payload: any = {
  name: name.trim(),
  description: description.trim(),
  image: typeof imageData === 'string' ? { path: imageData } : imageData,
  model: typeof modelData === 'string' ? { path: modelData } : modelData,
  activated: false,
  category,
  ...(additionalInfo.length > 0 ? { additionalInfo } : {}), // only include if not empty
};
      if (audioData) payload.audio = audioData;

      if (editingItem && editingItem.id) {
        const updRes = await update('models', payload, { id: editingItem.id });
        if (!updRes.success) throw new Error(updRes.message || 'Update failed');
        Alert.alert('Success', 'Model updated successfully');
      } else {
        const insertRes = await insert('models', payload);
        if (!insertRes.success) throw new Error(insertRes.message || 'Insert failed');
        Alert.alert('Success', 'Model uploaded successfully');
      }

      setName('');
      setDescription('');
      setImageFile(null);
      setModelFile(null);
      setAudioFile(null);
      setShowModal(false);
      setEditingItem(null);
      setCategory(categories[1]);
      setAdditionalInfo([]);
      await fetchItems();
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload error', err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onEdit(item: ModelItem) {
    setEditingItem(item);
    setName(item.name ?? '');
    setDescription(item.description ?? '');
    // prefill category + additional info
    setCategory(item.category ?? categories[1]);
    setAdditionalInfo(item.additionalInfo ? [...item.additionalInfo] : []);
    // don't prefill local file picks; user can pick new ones to replace
    setImageFile(null);
    setModelFile(null);
    setAudioFile(null);
    setShowModal(true);
  }

  async function onDelete(item: ModelItem) {
    if (!item.id) return;
    // quick log to verify handler is invoked
    console.log('onDelete triggered for', item.id);

    // web: Alert.alert may not show/behave as expected — use window.confirm for immediate feedback
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete model "${item.name ?? item.id}"?`);
      if (!confirmed) {
        console.log('web delete cancelled');
        return;
      }
      // proceed to delete (assert id non-null for TS)
      await performDelete(item.id!);
      return;
    }

    // mobile: keep existing Alert flow but log button results
    Alert.alert('Confirm', 'Delete this model?', [
      { text: 'Cancel', style: 'cancel', onPress: () => console.log('delete cancelled') },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // assert id non-null for TS
          await performDelete(item.id!);
        }
      }
    ]);
  }

  // extracted helper so we can log and reuse
  async function performDelete(id: string) {
    setLoading(true);
    try {
      console.log('calling remove for', id);
      const res = await remove('models', { id });
      console.log('remove response:', res);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      Alert.alert('Deleted', 'Model deleted');
      await fetchItems();
    } catch (e: any) {
      console.error('Delete error:', e);
      Alert.alert('Error', e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  // reset all activated => false
  async function resetAllActive() {
    Alert.alert('Confirm', 'Set all models to inactive?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          setLoading(true);
          try {
            // ensure we have latest list
            const res = await select('models', {});
            const rows: ModelItem[] = res.success && Array.isArray(res.data) ? res.data : [];
            await Promise.all(rows.map(async (r) => {
              if (!r.id) return;
              // update activated only if it's truthy to reduce write ops (optional)
              if (r.activated) {
                await update('models', { activated: false }, { id: r.id });
              }
            }));
            Alert.alert('Done', 'All models set to inactive');
            await fetchItems();
          } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.message ?? String(e));
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  }

  // build export payload: group names by category and sort alphabetically
  function buildExportJson(): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    items.forEach(it => {
      const cat = (it.category && it.category.trim()) ? it.category.trim() : 'uncategorized';
      if (!map[cat]) map[cat] = [];
      if (it.name && it.name.trim()) map[cat].push(it.name.trim());
    });
    // sort names alphabetically in each category
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.localeCompare(b)));
    // return with categories sorted alphabetically
    const ordered: Record<string, string[]> = {};
    Object.keys(map).sort((a, b) => a.localeCompare(b)).forEach(k => ordered[k] = map[k]);
    return ordered;
  }

  // export JSON: web triggers download, native logs + alert (can be extended to share/file-save)
  async function exportJson() {
    try {
      const payload = buildExportJson();
      const json = JSON.stringify(payload, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'models_by_category.json';
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Export', 'JSON file downloaded');
      } else {
        // mobile: fallback - log and notify. Replace with Sharing/FileSystem if desired.
        console.log('Exported JSON:', json);
        Alert.alert('Export', 'Exported JSON logged to console. Implement sharing/storage for mobile if needed.');
      }
    } catch (e: any) {
      console.error('Export error:', e);
      Alert.alert('Error', e?.message ?? String(e));
    }
  }

  // derived filtered + sorted data for datatable behaviour
  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const arr = items.filter(it => {
      if (!it) return false;
      if (filterCategory !== 'all' && it.category !== filterCategory) return false;
      if (filterActive === 'active' && !it.activated) return false;
      if (filterActive === 'inactive' && it.activated) return false;

      if (!q) return true;
      // search in name, description, category, model filename/path, additional info values
      const inName = (it.name || '').toLowerCase().includes(q);
      const inDesc = (it.description || '').toLowerCase().includes(q);
      const inCat = (it.category || '').toLowerCase().includes(q);
      const modelStr = typeof it.model === 'string' ? it.model : ((it.model && ((it.model as any).filename || (it.model as any).path)) || '');
      const inModel = (modelStr || '').toLowerCase().includes(q);
      const infoStr = (it.additionalInfo || []).map(i => `${i.key} ${i.value}`).join(' ').toLowerCase();
      const inInfo = infoStr.includes(q);
      return inName || inDesc || inCat || inModel || inInfo;
    });

    const cmp = (a: ModelItem, b: ModelItem) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        return dir * ((a.name || '').localeCompare(b.name || ''));
      }
      if (sortBy === 'category') {
        return dir * ((a.category || '').localeCompare(b.category || ''));
      }
      if (sortBy === 'activated') {
        return dir * ((Number(!!a.activated) - Number(!!b.activated)));
      }
      // createdAt fallback
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dir * (ta - tb);
    };

    return arr.slice().sort(cmp);
  }, [items, searchText, filterCategory, filterActive, sortBy, sortDir]);

  function toggleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  function renderRow({ item }: { item: ModelItem }) {
    const imageUri =
      typeof item.image === 'string'
        ? (item.image.startsWith('http') ? item.image : imageUrls[item.id ?? ''] ?? null)
        : (item.image && (item.image.url || item.image.path)) || null;
    const modelName =
      typeof item.model === 'string'
        ? item.model
        : (item.model && (item.model.filename || item.model.path));
    const audioName: string | null =
      typeof item.audio === 'string'
        ? item.audio
        : (item.audio && (((item.audio as any).filename) || ((item.audio as any).path) || ((item.audio as any).url))) || null;

    return (
      <View style={styles.tableRow}>
        <View style={[styles.cell, { flex: 1 }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.rowThumb} />
          ) : (
            <Text style={styles.cellText}>—</Text>
          )}
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellText}>{item.name}</Text>
          {item.category ? <Text style={{ fontSize: 11, color: '#666' }}>{item.category}</Text> : null}
        </View>

        <View style={[styles.cell, { flex: 1 }]}>
          <Text style={styles.cellText}>{item.activated ? 'Yes' : 'No'}</Text>
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellText} numberOfLines={1}>{modelName}</Text>
        </View>

        {/* Info (moved before audio) */}
        <View style={[styles.cell, { flex: 1, paddingHorizontal: 8 }]}>
          <Text style={{ fontSize: 12, color: '#444' }}>{(item.additionalInfo && item.additionalInfo.length) ? `${item.additionalInfo.length} info` : '—'}</Text>
        </View>

        <View style={[styles.cell, { flex: 1 }]}>
          <Text style={styles.cellText} numberOfLines={1}>{audioName ?? '—'}</Text>
        </View>

        {/* Edit / Delete buttons */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={() => onEdit(item)} style={{ padding: 6 }}>
            <Text style={{ color: '#007bff' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log('Delete button pressed for', item.id);
              onDelete(item);
            }}
            style={{ padding: 6 }}
          >
            <Text style={{ color: '#d9534f' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Models</Text>

      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Button title="Upload New Model" onPress={() => { setEditingItem(null); setCategory(categories[1]); setAdditionalInfo([]); setShowModal(true); }} />
        <Button title="Reset All Active" onPress={resetAllActive} color="#d9534f" disabled={loading} />
        <Button title="Export JSON" onPress={exportJson} disabled={loading} />
      </View>

      {/* datatable controls */}
      <View style={{ marginBottom: 12 }}>
        <TextInput
          placeholder="Search name, description, model, info..."
          value={searchText}
          onChangeText={setSearchText}
          style={[styles.input, { marginBottom: 8 }]}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setFilterCategory(cat)}
                style={[styles.pickerBtn, { backgroundColor: filterCategory === cat ? '#007bff' : '#f2f2f2', paddingHorizontal: 10 }]}
              >
                <Text style={[styles.pickerText, { color: filterCategory === cat ? '#fff' : '#333' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: filterActive === 'all' ? '#007bff' : '#f2f2f2' }]} onPress={() => setFilterActive('all')}>
              <Text style={[styles.pickerText, { color: filterActive === 'all' ? '#fff' : '#333' }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: filterActive === 'active' ? '#007bff' : '#f2f2f2' }]} onPress={() => setFilterActive('active')}>
              <Text style={[styles.pickerText, { color: filterActive === 'active' ? '#fff' : '#333' }]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: filterActive === 'inactive' ? '#007bff' : '#f2f2f2' }]} onPress={() => setFilterActive('inactive')}>
              <Text style={[styles.pickerText, { color: filterActive === 'inactive' ? '#fff' : '#333' }]}>Inactive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => { setShowModal(false); setEditingItem(null); }} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.heading, { marginBottom: 8 }]}>{editingItem ? 'Edit Model' : 'Upload Model'}</Text>

            <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />

            {/* Category selector */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: '600' }}>Category</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {categories.slice(1).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.pickerBtn, { backgroundColor: category === cat ? '#007bff' : '#f2f2f2' }]}
                  >
                    <Text style={[styles.pickerText, { color: category === cat ? '#fff' : '#333' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickers}>
              <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
                <Text style={styles.pickerText}>{imageFile ? `Image: ${imageFile.name}` : (editingItem?.image ? `Image: (kept)` : 'Pick Image')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBtn} onPress={pickModel}>
                <Text style={styles.pickerText}>{modelFile ? `Model: ${modelFile.name}` : (editingItem?.model ? `Model: (kept)` : 'Pick 3D Model')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBtn} onPress={pickAudio}>
                <Text style={styles.pickerText}>{audioFile ? `Audio: ${audioFile.name}` : (editingItem?.audio ? `Audio: (kept)` : 'Pick Audio (optional)')}</Text>
              </TouchableOpacity>
            </View>

            {/* Additional info list + add button */}
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontWeight: '600' }}>Additional Information</Text>
                <Button title="Add" onPress={() => { setInfoKey(''); setInfoValue(''); setShowInfoModal(true); }} />
              </View>

              {additionalInfo.length === 0 ? (
                <Text style={{ color: '#666', fontSize: 12 }}>No additional info</Text>
              ) : (
                additionalInfo.map((it, idx) => {
                  const removeItem = () => {
                    const next = additionalInfo.filter((_, i) => i !== idx);
                    setAdditionalInfo(next);
                  };
                  return (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ flex: 1 }}>{it.key}: {it.value}</Text>
                      <TouchableOpacity onPress={removeItem}>
                        <Text style={{ color: '#d9534f' }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => { setShowModal(false); setEditingItem(null); }} />
              <Button title={editingItem ? 'Update' : 'Upload'} onPress={handleUpload} disabled={loading} />
            </View>

            {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
          </View>
        </View>
      </Modal>

      {/* small modal for adding one key:value pair */}
      <Modal visible={showInfoModal} transparent animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%' }]}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Add Info</Text>
            <TextInput placeholder="Key (e.g. habitat)" value={infoKey} onChangeText={setInfoKey} style={styles.input} />
            <TextInput placeholder="Value (e.g. Savannas, grasslands)" value={infoValue} onChangeText={setInfoValue} style={styles.input} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => setShowInfoModal(false)} />
              <Button title="Add" onPress={() => {
                if (!infoKey.trim()) return Alert.alert('Validation', 'Please enter key');
                const next = [...additionalInfo, { key: infoKey.trim(), value: infoValue.trim() }];
                setAdditionalInfo(next);
                setShowInfoModal(false);
              }} />
            </View>
          </View>
        </View>
      </Modal>

      <Text style={[styles.subHeading, { marginTop: 18, marginBottom: 8 }]}>Existing Models ({filteredItems.length})</Text>

      {loading && items.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i, idx) => i.id ?? String(idx)}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={styles.table}
          ListHeaderComponent={() => (
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.cell, { flex: 1 }]}><Text style={[styles.cellText, styles.headerText]}>Thumb</Text></View>

              <TouchableOpacity onPress={() => toggleSort('name')} style={[styles.cell, { flex: 2 }]}>
                <Text style={[styles.cellText, styles.headerText]}>Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => toggleSort('activated')} style={[styles.cell, { flex: 1 }]}>
                <Text style={[styles.cellText, styles.headerText]}>Active {sortBy === 'activated' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>

              <View style={[styles.cell, { flex: 2 }]}><Text style={[styles.cellText, styles.headerText]}>3D File</Text></View>

              <TouchableOpacity onPress={() => toggleSort('category')} style={[styles.cell, { flex: 1 }]}>
                <Text style={[styles.cellText, styles.headerText]}>Info {sortBy === 'category' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</Text>
              </TouchableOpacity>

              <View style={[styles.cell, { flex: 1 }]}><Text style={[styles.cellText, styles.headerText]}>Audio</Text></View>

              <View style={[styles.cell, { flex: 1 }]}><Text style={[styles.cellText, styles.headerText]}>Actions</Text></View>
            </View>
          )}
        />
      )}
    </View>
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
  table: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#f7f7f7' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8, paddingHorizontal: 10 },
  cell: { paddingHorizontal: 6, justifyContent: 'center' },
  cellText: { fontSize: 13, color: '#222' },
  headerText: { fontWeight: '700', color: '#333' },
  rowThumb: { width: 60, height: 60, borderRadius: 6, resizeMode: 'cover' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 5 },
});
