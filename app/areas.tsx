import { View, Text, Pressable, FlatList, StyleSheet, TextInput, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Area } from "@/lib/types";

export default function AreasScreen() {
  const { state, addArea, updateArea, deleteArea } = useApp();
  const colors = useColors();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) { Alert.alert('Błąd', 'Nazwa obszaru jest wymagana.'); return; }
    addArea(newName.trim(), newDesc.trim() || undefined);
    setNewName(''); setNewDesc(''); setShowAdd(false);
  };

  const handleEdit = (area: Area) => {
    setEditingId(area.id);
    setEditName(area.name);
    setEditDesc(area.description || '');
  };

  const handleSaveEdit = (area: Area) => {
    if (!editName.trim()) { Alert.alert('Błąd', 'Nazwa obszaru jest wymagana.'); return; }
    updateArea({ ...area, name: editName.trim(), description: editDesc.trim() || undefined });
    setEditingId(null);
  };

  const handleDelete = (area: Area) => {
    Alert.alert('Usuń obszar', `Czy na pewno chcesz usunąć "${area.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteArea(area.id) },
    ]);
  };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <FlatList
        data={state.areas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          showAdd ? (
            <View style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <Text style={[styles.addCardTitle, { color: colors.foreground }]}>Nowy obszar</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Nazwa obszaru"
                placeholderTextColor={colors.muted}
                value={newName}
                onChangeText={setNewName}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Opis (opcjonalnie)"
                placeholderTextColor={colors.muted}
                value={newDesc}
                onChangeText={setNewDesc}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <View style={styles.rowBtns}>
                <Pressable style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.6 }]} onPress={() => { setShowAdd(false); setNewName(''); setNewDesc(''); }}>
                  <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Anuluj</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]} onPress={handleAdd}>
                  <Text style={styles.saveBtnText}>Dodaj</Text>
                </Pressable>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          !showAdd ? (
            <Pressable
              style={({ pressed }) => [styles.addAreaBtn, { borderColor: colors.primary }, pressed && { opacity: 0.7 }]}
              onPress={() => setShowAdd(true)}
            >
              <IconSymbol name="plus" size={20} color={colors.primary} />
              <Text style={[styles.addAreaBtnText, { color: colors.primary }]}>Dodaj nowy obszar</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          editingId === item.id ? (
            <View style={[styles.editCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={editName}
                onChangeText={setEditName}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Opis (opcjonalnie)"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
              <View style={styles.rowBtns}>
                <Pressable style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.6 }]} onPress={() => setEditingId(null)}>
                  <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Anuluj</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]} onPress={() => handleSaveEdit(item)}>
                  <Text style={styles.saveBtnText}>Zapisz</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.areaRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.areaInfo}>
                <Text style={[styles.areaName, { color: colors.foreground }]}>{item.name}</Text>
                {item.description ? <Text style={[styles.areaDesc, { color: colors.muted }]}>{item.description}</Text> : null}
              </View>
              <View style={styles.areaActions}>
                <Pressable style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]} onPress={() => handleEdit(item)}>
                  <IconSymbol name="pencil" size={18} color={colors.primary} />
                </Pressable>
                <Pressable style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]} onPress={() => handleDelete(item)}>
                  <IconSymbol name="trash.fill" size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>
          )
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Brak obszarów. Dodaj pierwszy poniżej.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  areaRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  areaInfo: { flex: 1 },
  areaName: { fontSize: 15, fontWeight: '700' },
  areaDesc: { fontSize: 13, marginTop: 2 },
  areaActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  addAreaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 8 },
  addAreaBtnText: { fontSize: 15, fontWeight: '600' },
  addCard: { borderRadius: 12, borderWidth: 1.5, padding: 16, marginBottom: 12, gap: 10 },
  editCard: { borderRadius: 12, borderWidth: 1.5, padding: 16, gap: 10 },
  addCardTitle: { fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyCard: { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
