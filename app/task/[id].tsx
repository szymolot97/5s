import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, Alert, Image, Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PILLAR_LABELS, Task } from "@/lib/types";

const STATUS_OPTIONS: { value: Task['status']; label: string; color: string }[] = [
  { value: 'open', label: 'Otwarte', color: '#D97706' },
  { value: 'in_progress', label: 'W toku', color: '#1A56DB' },
  { value: 'done', label: 'Zakończone', color: '#16A34A' },
];

const SEVERITY_LABELS: Record<string, string> = {
  low: 'NISKI',
  medium: 'ŚREDNI',
  high: 'WYSOKI',
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateTask } = useApp();
  const colors = useColors();
  const router = useRouter();

  const task = state.tasks.find((t) => t.id === id);
  const [notes, setNotes] = useState(task?.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [photos, setPhotos] = useState<string[]>(task?.photos || []);

  if (!task) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.error }}>Nie znaleziono zadania.</Text>
      </ScreenContainer>
    );
  }

  const pillarInfo = PILLAR_LABELS[task.pillar];
  const sColor = task.severity === 'low' ? colors.success : task.severity === 'medium' ? colors.warning : colors.error;

  const handleStatusChange = (newStatus: Task['status']) => {
    updateTask({ ...task, status: newStatus, notes, photos, dueDate: dueDate?.toISOString() });
  };

  const handleSave = () => {
    updateTask({ ...task, notes, photos, dueDate: dueDate?.toISOString() });
    Alert.alert('Zapisano', 'Zadanie zostało zaktualizowane.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Wymagane uprawnienie', 'Potrzebny jest dostęp do aparatu, aby zrobić zdjęcie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Wymagane uprawnienie', 'Potrzebny jest dostęp do galerii, aby wybrać zdjęcie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    Alert.alert('Usuń zdjęcie', 'Czy na pewno chcesz usunąć to zdjęcie?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => setPhotos((prev) => prev.filter((_, i) => i !== idx)) },
    ]);
  };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Informacje nagłówkowe */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerBadges}>
            <View style={[styles.badge, { backgroundColor: pillarInfo.color + '20' }]}>
              <Text style={[styles.badgeText, { color: pillarInfo.color }]}>{task.pillar} — {pillarInfo.name}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: sColor + '20' }]}>
              <Text style={[styles.badgeText, { color: sColor }]}>WAŻNOŚĆ: {SEVERITY_LABELS[task.severity]}</Text>
            </View>
          </View>
          <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
          <Text style={[styles.taskDesc, { color: colors.muted }]}>{task.description}</Text>
          <View style={styles.metaRow}>
            <IconSymbol name={"mappin.fill" as any} size={14} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>{task.departmentName ? `${task.departmentName} › ${task.zoneName}` : 'Nieznany obszar'}</Text>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol name="clock.fill" size={14} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              Utworzono {new Date(task.createdAt).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Status */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => {
            const active = task.status === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.statusBtn,
                  { borderColor: opt.color },
                  active && { backgroundColor: opt.color },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => handleStatusChange(opt.value)}
              >
                <Text style={[styles.statusBtnText, { color: active ? '#fff' : opt.color }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Termin realizacji */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Termin realizacji</Text>
        <Pressable
          style={({ pressed }) => [
            styles.dueDateBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <IconSymbol name="clock.fill" size={18} color={colors.primary} />
          <Text style={[styles.dueDateText, { color: dueDate ? colors.foreground : colors.muted }]}>
            {dueDate
              ? dueDate.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
              : 'Ustaw termin realizacji'}
          </Text>
          {dueDate && (
            <Pressable
              onPress={() => setDueDate(undefined)}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </Pressable>
          )}
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
            minimumDate={new Date()}
            onChange={(_event: any, date?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setDueDate(date);
            }}
          />
        )}

        {/* Notatki */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Notatki</Text>
        <TextInput
          style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Dodaj notatki do tego zadania..."
          placeholderTextColor={colors.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Zdjęcia */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Zdjęcia ({photos.length})</Text>
        <View style={styles.photoButtonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.photoBtn,
              { backgroundColor: colors.primary + '15', borderColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleTakePhoto}
          >
            <IconSymbol name="camera.fill" size={20} color={colors.primary} />
            <Text style={[styles.photoBtnText, { color: colors.primary }]}>Aparat</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.photoBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handlePickPhoto}
          >
            <IconSymbol name="photo.fill" size={20} color={colors.muted} />
            <Text style={[styles.photoBtnText, { color: colors.muted }]}>Galeria</Text>
          </Pressable>
        </View>
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbContainer}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  style={[styles.photoRemoveBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleRemovePhoto(idx)}
                >
                  <IconSymbol name="xmark" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Przycisk zapisz */}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleSave}
        >
          <IconSymbol name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>Zapisz zmiany</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20, gap: 8 },
  headerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  taskTitle: { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  taskDesc: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  statusBtnText: { fontSize: 14, fontWeight: '700' },
  dueDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, borderWidth: 1 },
  dueDateText: { flex: 1, fontSize: 15 },
  notesInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 100 },
  photoButtonRow: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1 },
  photoBtnText: { fontSize: 14, fontWeight: '600' },
  photoThumbContainer: { marginRight: 10, position: 'relative' },
  photoThumb: { width: 100, height: 100, borderRadius: 10 },
  photoRemoveBtn: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
