import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StyleSheet } from "react-native";
import { Audit } from "@/lib/types";

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function AuditRow({ audit, onPress }: { audit: Audit; onPress: () => void }) {
  const colors = useColors();
  const date = new Date(audit.completedAt || audit.startedAt);
  const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });
  const score = audit.scores.total;
  const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.auditRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.auditRowLeft}>
        <Text style={[styles.auditAreaName, { color: colors.foreground }]}>{audit.departmentName} • {audit.zoneName}</Text>
        <Text style={[styles.auditDate, { color: colors.muted }]}>{dateStr}</Text>
        <Text style={[styles.auditNCs, { color: colors.muted }]}>
          {audit.nonConformances.length} {audit.nonConformances.length === 1 ? 'niezgodność' : 'niezgodności'}
        </Text>
      </View>
      <View style={styles.auditRowRight}>
        <Text style={[styles.auditScore, { color: scoreColor }]}>{score}%</Text>
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();

  const completedAudits = state.audits.filter((a) => a.status === 'completed');
  const recentAudits = [...completedAudits]
    .sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime())
    .slice(0, 5);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const auditsThisMonth = completedAudits.filter(
    (a) => new Date(a.completedAt || a.startedAt) >= thisMonth
  ).length;

  const openTasks = state.tasks.filter((t) => t.status !== 'done').length;

  const avgScore =
    completedAudits.length > 0
      ? Math.round(completedAudits.reduce((s, a) => s + a.scores.total, 0) / completedAudits.length)
      : 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Nagłówek */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Audyt 5S</Text>
          <Text style={styles.headerSubtitle}>Kontrola Jakości Produkcji</Text>
        </View>

        {/* Statystyki */}
        <View style={styles.statsRow}>
          <StatCard label="Audyty w tym miesiącu" value={auditsThisMonth} color={colors.primary} />
          <StatCard label="Otwarte zadania" value={openTasks} color={openTasks > 0 ? colors.warning : colors.success} />
          <StatCard
            label="Śr. wynik"
            value={completedAudits.length > 0 ? `${avgScore}%` : '—'}
            color={avgScore >= 80 ? colors.success : avgScore >= 60 ? colors.warning : colors.error}
          />
        </View>

        {/* Przycisk CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/audit/area-select' as any)}
          >
            <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
            <Text style={styles.ctaText}>Rozpocznij nowy audyt</Text>
          </Pressable>
        </View>

        {/* Ostatnie audyty */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ostatnie audyty</Text>
            <Pressable onPress={() => router.push('/(tabs)/reports' as any)} style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Zobacz wszystkie</Text>
            </Pressable>
          </View>

          {recentAudits.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="clipboard.fill" size={36} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Brak audytów. Rozpocznij pierwszy audyt!</Text>
            </View>
          ) : (
            recentAudits.map((audit) => (
              <AuditRow
                key={audit.id}
                audit={audit}
                onPress={() => router.push(`/report/${audit.id}` as any)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: -20, marginBottom: 8 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 2 },
  ctaContainer: { paddingHorizontal: 16, marginVertical: 12 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  auditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  auditRowLeft: { flex: 1 },
  auditAreaName: { fontSize: 15, fontWeight: '600' },
  auditDate: { fontSize: 12, marginTop: 2 },
  auditNCs: { fontSize: 12, marginTop: 1 },
  auditRowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  auditScore: { fontSize: 18, fontWeight: '800' },
  emptyCard: { alignItems: 'center', padding: 32, borderRadius: 12, borderWidth: 1, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
