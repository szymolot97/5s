import { View, Text, Pressable, ScrollView, StyleSheet, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PILLAR_LABELS, Pillar } from "@/lib/types";

function ScoreBar({ pillar, score }: { pillar: Pillar; score: number }) {
  const colors = useColors();
  const info = PILLAR_LABELS[pillar];
  const barColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;
  return (
    <View style={styles.scoreBarRow}>
      <View style={[styles.pillarBadgeSmall, { backgroundColor: info.color + '20' }]}>
        <Text style={[styles.pillarBadgeSmallText, { color: info.color }]}>{pillar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.scoreBarInfo}>
          <Text style={[styles.scoreBarName, { color: colors.foreground }]}>{info.name}</Text>
          <Text style={[styles.scoreBarPct, { color: barColor }]}>{score}%</Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, { width: `${score}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

const SEVERITY_LABELS: Record<string, string> = {
  low: 'NISKI',
  medium: 'ŚREDNI',
  high: 'WYSOKI',
};

export default function AuditSummaryScreen() {
  const { auditId } = useLocalSearchParams<{ auditId: string }>();
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();

  const audit = state.audits.find((a) => a.id === auditId);

  if (!audit) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.error }}>Nie znaleziono audytu.</Text>
      </ScreenContainer>
    );
  }

  const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
  const totalScore = audit.scores.total;
  const scoreColor = totalScore >= 80 ? colors.success : totalScore >= 60 ? colors.warning : colors.error;
  const scoreLabel = totalScore >= 80 ? 'Doskonały' : totalScore >= 60 ? 'Wymaga poprawy' : 'Krytyczny';

  const ncCount = audit.nonConformances.length;
  const passCount = audit.items.filter((i) => i.status === 'pass').length;

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Ogólny wynik */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.scoreCardTitle, { color: colors.muted }]}>Łączny wynik 5S</Text>
          <Text style={[styles.scoreCardArea, { color: colors.foreground }]}>{audit.departmentName} • {audit.zoneName}</Text>
          <View style={[styles.bigScoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.bigScoreNumber, { color: scoreColor }]}>{totalScore}</Text>
            <Text style={[styles.bigScorePct, { color: scoreColor }]}>%</Text>
          </View>
          <View style={[styles.scoreLabelBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.scoreLabelText, { color: scoreColor }]}>{scoreLabel}</Text>
          </View>
          <Text style={[styles.scoreStats, { color: colors.muted }]}>
            {ncCount} {ncCount === 1 ? 'niezgodność' : 'niezgodności'} • {passCount} punktów zaliczonych
          </Text>
        </View>

        {/* Wynik według filarów */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Wynik według filarów</Text>
        <View style={[styles.pillarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {pillars.map((p) => (
            <ScoreBar key={p} pillar={p} score={audit.scores[p]} />
          ))}
        </View>

        {/* Niezgodności */}
        {audit.nonConformances.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Niezgodności</Text>
            {audit.nonConformances.map((nc) => {
              const sColor = nc.severity === 'low' ? colors.success : nc.severity === 'medium' ? colors.warning : colors.error;
              const pillarInfo = PILLAR_LABELS[nc.pillar];
              return (
                <View key={nc.id} style={[styles.ncCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.ncCardHeader}>
                    <View style={[styles.pillarBadgeSmall, { backgroundColor: pillarInfo.color + '20' }]}>
                      <Text style={[styles.pillarBadgeSmallText, { color: pillarInfo.color }]}>{nc.pillar}</Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sColor + '20' }]}>
                      <Text style={[styles.severityBadgeText, { color: sColor }]}>
                        {SEVERITY_LABELS[nc.severity]}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.ncDesc, { color: colors.foreground }]}>{nc.description}</Text>
                  {nc.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {nc.photos.map((uri, idx) => (
                        <Image key={idx} source={{ uri }} style={styles.ncPhoto} />
                      ))}
                    </ScrollView>
                  )}
                  <View style={[styles.taskCreatedTag, { backgroundColor: colors.primary + '10' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={13} color={colors.primary} />
                    <Text style={[styles.taskCreatedText, { color: colors.primary }]}>Zadanie utworzone</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Przyciski akcji */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push(`/report/${auditId}` as any)}
          >
            <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Zobacz raport</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push('/(tabs)/tasks' as any)}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Zobacz zadania</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scoreCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 20, gap: 8 },
  scoreCardTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreCardArea: { fontSize: 20, fontWeight: '800' },
  bigScoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginVertical: 8 },
  bigScoreNumber: { fontSize: 36, fontWeight: '900' },
  bigScorePct: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  scoreLabelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  scoreLabelText: { fontSize: 14, fontWeight: '700' },
  scoreStats: { fontSize: 13, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  pillarCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20, gap: 14 },
  scoreBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillarBadgeSmall: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  pillarBadgeSmallText: { fontSize: 11, fontWeight: '800' },
  scoreBarInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  scoreBarName: { fontSize: 13, fontWeight: '600' },
  scoreBarPct: { fontSize: 13, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  ncCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  ncCardHeader: { flexDirection: 'row', gap: 8 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  severityBadgeText: { fontSize: 11, fontWeight: '700' },
  ncDesc: { fontSize: 14, lineHeight: 20 },
  ncPhoto: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  taskCreatedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  taskCreatedText: { fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
});
