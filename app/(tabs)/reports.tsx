import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Audit } from "@/lib/types";

function AuditReportCard({ audit, onPress }: { audit: Audit; onPress: () => void }) {
  const colors = useColors();
  const score = audit.scores.total;
  const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;
  const date = new Date(audit.completedAt || audit.startedAt);
  const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });
  const ncCount = audit.nonConformances.length;
  const passCount = audit.items.filter((i) => i.status === 'pass').length;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        <Text style={[styles.cardArea, { color: colors.foreground }]}>{audit.departmentName}</Text>
        <Text style={[styles.cardZone, { color: colors.primary }]}>{audit.zoneName}</Text>
        <Text style={[styles.cardDate, { color: colors.muted }]}>{dateStr}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.metaBadgeText, { color: colors.muted }]}>
              {ncCount} {ncCount === 1 ? 'niezgodność' : 'niezgodności'}
            </Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.metaBadgeText, { color: colors.muted }]}>
              {passCount}/{audit.items.length} zaliczonych
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.scorePct, { color: scoreColor }]}>%</Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function ReportsScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();

  const completedAudits = [...state.audits]
    .filter((a) => a.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime());

  const avgScore = completedAudits.length > 0
    ? Math.round(completedAudits.reduce((s, a) => s + a.scores.total, 0) / completedAudits.length)
    : 0;

  return (
    <ScreenContainer>
      {/* Nagłówek */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Raporty</Text>
            {completedAudits.length > 0 && (
              <Text style={[styles.headerSub, { color: colors.muted }]}>
                {completedAudits.length} {completedAudits.length === 1 ? 'audyt' : 'audyty'} • Śr. wynik: {avgScore}%
              </Text>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.deptReportBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push('/report/department' as any)}
          >
            <IconSymbol name="building.2.fill" size={15} color="#fff" />
            <Text style={styles.deptReportBtnText}>Zbiorcze</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={completedAudits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <AuditReportCard
            audit={item}
            onPress={() => router.push(`/report/${item.id}` as any)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="chart.bar.fill" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Brak raportów</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Zakończ audyt, aby wygenerować pierwszy raport.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push('/audit/area-select' as any)}
            >
              <Text style={styles.startBtnText}>Rozpocznij pierwszy audyt</Text>
            </Pressable>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deptReportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  deptReportBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  cardArea: { fontSize: 16, fontWeight: '700' },
  cardZone: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  cardDate: { fontSize: 13, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
  metaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaBadgeText: { fontSize: 11, fontWeight: '600' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  scoreNumber: { fontSize: 17, fontWeight: '900' },
  scorePct: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  startBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
