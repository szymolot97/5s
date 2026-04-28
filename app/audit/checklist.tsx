import {
  View, Text, Pressable, FlatList, StyleSheet, Modal,
  TextInput, ScrollView, Alert, Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AuditItem, ItemStatus, Pillar, PILLAR_LABELS } from "@/lib/types";

const STATUS_OPTIONS: { value: ItemStatus; label: string; color: string }[] = [
  { value: 'pass', label: 'OK', color: '#16A34A' },
  { value: 'partial', label: 'Częściowo', color: '#D97706' },
  { value: 'fail', label: 'Niezgodność', color: '#DC2626' },
];

function StatusToggle({
  status,
  onSelect,
}: {
  status: ItemStatus;
  onSelect: (s: ItemStatus) => void;
  colors: any;
}) {
  return (
    <View style={styles.toggleRow}>
      {STATUS_OPTIONS.map((opt) => {
        const active = status === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.toggleBtn,
              { borderColor: opt.color },
              active && { backgroundColor: opt.color },
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.toggleBtnText, { color: active ? '#fff' : opt.color }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ChecklistScreen() {
  const { auditId } = useLocalSearchParams<{ auditId: string }>();
  const { state, updateAuditItem, addNonConformance, completeAudit } = useApp();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const audit = state.audits.find((a) => a.id === auditId);

  const [ncModal, setNcModal] = useState<{ visible: boolean; item: AuditItem | null }>({
    visible: false,
    item: null,
  });
  const [ncDesc, setNcDesc] = useState('');
  const [ncSeverity, setNcSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [ncPhotos, setNcPhotos] = useState<string[]>([]);

  const groupedItems = useMemo(() => {
    if (!audit) return [];
    const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
    return pillars.map((pillar) => ({
      pillar,
      items: audit.items.filter((i) => i.pillar === pillar),
    }));
  }, [audit]);

  const progress = useMemo(() => {
    if (!audit) return 0;
    const done = audit.items.filter((i) => i.status !== 'pending').length;
    return done / audit.items.length;
  }, [audit]);

  if (!audit) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.error }}>Nie znaleziono audytu.</Text>
      </ScreenContainer>
    );
  }

  const closeNcModal = () => setNcModal({ visible: false, item: null });

  const handleStatusChange = (item: AuditItem, newStatus: ItemStatus) => {
    updateAuditItem(auditId, { ...item, status: newStatus });
    if (newStatus === 'fail' || newStatus === 'partial') {
      setNcModal({ visible: true, item: { ...item, status: newStatus } });
      setNcDesc('');
      setNcSeverity('medium');
      setNcPhotos([]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Wymagane uprawnienie', 'Potrzebny jest dostęp do aparatu, aby zrobić zdjęcie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled) {
      setNcPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: true });
    if (!result.canceled) {
      setNcPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSaveNC = () => {
    if (!ncModal.item || !ncDesc.trim()) {
      Alert.alert('Wymagane', 'Proszę opisać niezgodność.');
      return;
    }
    addNonConformance(auditId, {
      auditId,
      auditItemId: ncModal.item.id,
      pillar: ncModal.item.pillar,
      description: ncDesc.trim(),
      photos: ncPhotos,
      severity: ncSeverity,
    });
    closeNcModal();
  };

  const handleFinishAudit = () => {
    const pending = audit.items.filter((i) => i.status === 'pending').length;
    if (pending > 0) {
      Alert.alert(
        'Niekompletny audyt',
        `${pending} ${pending === 1 ? 'punkt jest' : 'punkty są'} jeszcze nieocenione. Czy chcesz zakończyć?`,
        [
          { text: 'Kontynuuj audyt', style: 'cancel' },
          {
            text: 'Zakończ mimo to',
            onPress: () => {
              completeAudit(auditId);
              router.replace(`/audit/summary?auditId=${auditId}` as any);
            },
          },
        ]
      );
    } else {
      completeAudit(auditId);
      router.replace(`/audit/summary?auditId=${auditId}` as any);
    }
  };

  const severityLabels: Record<string, string> = {
    low: 'Niski',
    medium: 'Średni',
    high: 'Wysoki',
  };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      {/* Pasek postępu */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.foreground }]}>{audit.zoneName}</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>

      <FlatList
        data={groupedItems}
        keyExtractor={(item) => item.pillar}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item: group }) => {
          const pillarInfo = PILLAR_LABELS[group.pillar];
          const pillarItems = group.items;
          const passCount = pillarItems.filter((i) => i.status === 'pass').length;
          const totalCount = pillarItems.length;

          return (
            <View style={[styles.pillarSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.pillarHeader, { borderBottomColor: colors.border }]}>
                <View style={[styles.pillarBadge, { backgroundColor: pillarInfo.color + '20' }]}>
                  <Text style={[styles.pillarBadgeText, { color: pillarInfo.color }]}>{group.pillar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pillarName, { color: colors.foreground }]}>{pillarInfo.name}</Text>
                </View>
                <Text style={[styles.pillarScore, { color: pillarInfo.color }]}>{passCount}/{totalCount}</Text>
              </View>

              {pillarItems.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.checkItem,
                    idx < pillarItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.checkDesc, { color: colors.foreground }]}>{item.description}</Text>
                  <StatusToggle
                    status={item.status}
                    onSelect={(s) => handleStatusChange(item, s)}
                    colors={colors}
                  />
                  {item.nonConformanceId && (
                    <View style={[styles.ncTag, { backgroundColor: colors.error + '15' }]}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={12} color={colors.error} />
                      <Text style={[styles.ncTagText, { color: colors.error }]}>Niezgodność zarejestrowana</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Przycisk zakończenia */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.finishBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleFinishAudit}
        >
          <IconSymbol name="checkmark.circle.fill" size={22} color="#fff" />
          <Text style={styles.finishBtnText}>Zakończ audyt</Text>
        </Pressable>
      </View>

      {/* Modal niezgodności */}
      <Modal
        visible={ncModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeNcModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Nagłówek z bezpiecznym marginesem dla paska systemowego */}
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: colors.border,
                paddingTop: Math.max(insets.top + 8, 20),
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Rejestruj niezgodność</Text>
            <Pressable
              onPress={closeNcModal}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.border },
                pressed && { opacity: 0.6 },
              ]}
            >
              <IconSymbol name="xmark" size={16} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {ncModal.item && (
              <View style={[styles.ncItemRef, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.ncItemRefLabel, { color: colors.muted }]}>Punkt kontrolny</Text>
                <Text style={[styles.ncItemRefText, { color: colors.foreground }]}>{ncModal.item.description}</Text>
              </View>
            )}

            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Opis niezgodności *</Text>
              <TextInput
                style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="Opisz znaleziony problem..."
                placeholderTextColor={colors.muted}
                value={ncDesc}
                onChangeText={setNcDesc}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Poziom ważności</Text>
              <View style={styles.severityRow}>
                {(['low', 'medium', 'high'] as const).map((s) => {
                  const sColor = s === 'low' ? colors.success : s === 'medium' ? colors.warning : colors.error;
                  const active = ncSeverity === s;
                  return (
                    <Pressable
                      key={s}
                      style={({ pressed }) => [
                        styles.severityBtn,
                        { borderColor: sColor },
                        active && { backgroundColor: sColor },
                        pressed && { opacity: 0.75 },
                      ]}
                      onPress={() => setNcSeverity(s)}
                    >
                      <Text style={[styles.severityBtnText, { color: active ? '#fff' : sColor }]}>
                        {severityLabels[s]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Zdjęcia ({ncPhotos.length})</Text>
              <View style={styles.photoRow}>
                <Pressable
                  style={({ pressed }) => [styles.photoBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }, pressed && { opacity: 0.7 }]}
                  onPress={handleTakePhoto}
                >
                  <IconSymbol name="camera.fill" size={22} color={colors.primary} />
                  <Text style={[styles.photoBtnText, { color: colors.primary }]}>Aparat</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                  onPress={handlePickPhoto}
                >
                  <IconSymbol name="photo.fill" size={22} color={colors.muted} />
                  <Text style={[styles.photoBtnText, { color: colors.muted }]}>Galeria</Text>
                </Pressable>
              </View>
              {ncPhotos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {ncPhotos.map((uri, idx) => (
                    <View key={idx} style={styles.photoThumbContainer}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <Pressable
                        style={[styles.photoRemoveBtn, { backgroundColor: colors.error }]}
                        onPress={() => setNcPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <IconSymbol name="xmark" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <Pressable
              style={({ pressed }) => [styles.saveNCBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}
              onPress={handleSaveNC}
            >
              <Text style={styles.saveNCBtnText}>Zapisz i utwórz zadanie</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const severityLabels: Record<string, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
};

const styles = StyleSheet.create({
  progressContainer: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 14, fontWeight: '600' },
  progressPct: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  pillarSection: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1 },
  pillarBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pillarBadgeText: { fontSize: 13, fontWeight: '800' },
  pillarName: { fontSize: 14, fontWeight: '700' },
  pillarScore: { fontSize: 14, fontWeight: '700' },
  checkItem: { padding: 12, gap: 8 },
  checkDesc: { fontSize: 14, lineHeight: 20 },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  toggleBtnText: { fontSize: 12, fontWeight: '700' },
  ncTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  ncTagText: { fontSize: 11, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  finishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12 },
  finishBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ncItemRef: { padding: 12, borderRadius: 10, borderWidth: 1, gap: 4 },
  ncItemRefLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  ncItemRefText: { fontSize: 14, lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 100 },
  severityRow: { flexDirection: 'row', gap: 10 },
  severityBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  severityBtnText: { fontSize: 14, fontWeight: '700' },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1 },
  photoBtnText: { fontSize: 14, fontWeight: '600' },
  photoThumbContainer: { marginRight: 8, position: 'relative' },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  photoRemoveBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  saveNCBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  saveNCBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
