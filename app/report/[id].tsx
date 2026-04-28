import {
  View, Text, Pressable, ScrollView, StyleSheet, Image, Alert, ActivityIndicator
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PILLAR_LABELS, Pillar, Audit } from "@/lib/types";

const SEVERITY_LABELS: Record<string, string> = {
  low: 'NISKI',
  medium: 'ŚREDNI',
  high: 'WYSOKI',
};

async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return '';
  }
}

async function generateAuditHTML(audit: Audit): Promise<string> {
  const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
  const scoreColor = (s: number) => s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#DC2626';
  const severityColor = (s: string) => s === 'low' ? '#16A34A' : s === 'medium' ? '#D97706' : '#DC2626';
  const severityLabel = (s: string) => s === 'low' ? 'NISKI' : s === 'medium' ? 'ŚREDNI' : 'WYSOKI';

  const pillarRows = pillars.map((p) => {
    const info = PILLAR_LABELS[p];
    const score = audit.scores[p];
    const color = scoreColor(score);
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:700;color:${info.color}">${p}</td>
        <td style="padding:10px 12px">${info.name}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:800;color:${color}">${score}%</td>
        <td style="padding:10px 12px">
          <div style="background:#e5e7eb;border-radius:4px;height:10px;overflow:hidden">
            <div style="width:${score}%;height:100%;background:${color};border-radius:4px"></div>
          </div>
        </td>
      </tr>`;
  }).join('');

  const ncSections = await Promise.all(audit.nonConformances.map(async (nc) => {
    const info = PILLAR_LABELS[nc.pillar];
    const sColor = severityColor(nc.severity);
    const photoImgs = await Promise.all(
      nc.photos.map(async (uri) => {
        const b64 = await imageUriToBase64(uri);
        return b64 ? `<img src="${b64}" style="width:140px;height:140px;object-fit:cover;border-radius:8px;margin:4px" />` : '';
      })
    );
    return `
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px">
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <span style="background:${info.color}20;color:${info.color};padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700">${nc.pillar}</span>
          <span style="background:${sColor}20;color:${sColor};padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700">${severityLabel(nc.severity)}</span>
        </div>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.5">${nc.description}</p>
        ${photoImgs.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${photoImgs.join('')}</div>` : ''}
      </div>`;
  }));

  const date = new Date(audit.completedAt || audit.startedAt);
  const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalColor = scoreColor(audit.scores.total);
  const ncCount = audit.nonConformances.length;
  const passCount = audit.items.filter((i) => i.status === 'pass').length;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; }
    h1 { font-size: 24px; font-weight: 900; color: #1A56DB; margin: 0 0 4px; }
    h2 { font-size: 16px; font-weight: 700; margin: 24px 0 10px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    tr:nth-child(even) td { background: #f8fafc; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .score-circle { width: 80px; height: 80px; border-radius: 50%; border: 4px solid ${totalColor}; display: flex; align-items: center; justify-content: center; flex-direction: column; }
    .score-num { font-size: 28px; font-weight: 900; color: ${totalColor}; }
    .score-pct { font-size: 12px; font-weight: 700; color: ${totalColor}; }
    .meta { font-size: 13px; color: #64748b; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Raport Audytu 5S</h1>
      <p class="meta"><strong>Dział:</strong> ${audit.departmentName}</p>
      <p class="meta"><strong>Strefa:</strong> ${audit.zoneName}</p>
      <p class="meta"><strong>Data:</strong> ${dateStr}</p>
      <p class="meta"><strong>Niezgodności:</strong> ${ncCount}</p>
      <p class="meta"><strong>Punkty zaliczone:</strong> ${passCount} / ${audit.items.length}</p>
    </div>
    <div class="score-circle">
      <span class="score-num">${audit.scores.total}</span>
      <span class="score-pct">%</span>
    </div>
  </div>

  <h2>Wynik według filarów</h2>
  <table>
    <thead><tr><th>Filar</th><th>Nazwa</th><th>Wynik</th><th>Postęp</th></tr></thead>
    <tbody>${pillarRows}</tbody>
  </table>

  ${audit.nonConformances.length > 0 ? `
  <h2>Niezgodności (${audit.nonConformances.length})</h2>
  ${ncSections.join('')}
  ` : ''}

  <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center">
    Wygenerowano przez aplikację Audyt 5S • ${new Date().toLocaleString('pl-PL')}
  </p>
</body>
</html>`;
}

function ScoreBar({ pillar, score }: { pillar: Pillar; score: number }) {
  const colors = useColors();
  const info = PILLAR_LABELS[pillar];
  const barColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;
  return (
    <View style={styles.scoreBarRow}>
      <View style={[styles.pillarBadge, { backgroundColor: info.color + '20' }]}>
        <Text style={[styles.pillarBadgeText, { color: info.color }]}>{pillar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.barInfo}>
          <Text style={[styles.barName, { color: colors.foreground }]}>{info.name}</Text>
          <Text style={[styles.barPct, { color: barColor }]}>{score}%</Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, { width: `${score}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const colors = useColors();
  const [exporting, setExporting] = useState(false);

  const audit = state.audits.find((a) => a.id === id);

  if (!audit) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.error }}>Nie znaleziono raportu.</Text>
      </ScreenContainer>
    );
  }

  const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
  const totalScore = audit.scores.total;
  const scoreColor = totalScore >= 80 ? colors.success : totalScore >= 60 ? colors.warning : colors.error;
  const date = new Date(audit.completedAt || audit.startedAt);
  const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });
  const ncCount = audit.nonConformances.length;
  const passCount = audit.items.filter((i) => i.status === 'pass').length;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html = await generateAuditHTML(audit);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Audyt 5S - ${audit.departmentName} › ${audit.zoneName}` });
      } else {
        Alert.alert('PDF zapisany', `Raport zapisany do: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się wygenerować PDF. Spróbuj ponownie.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Nagłówek */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.areaName, { color: colors.foreground }]}>{audit.departmentName} • {audit.zoneName}</Text>
              <Text style={[styles.dateText, { color: colors.muted }]}>{dateStr}</Text>
              <Text style={[styles.statsText, { color: colors.muted }]}>
                {audit.zoneName} • {ncCount} {ncCount === 1 ? 'niezgodność' : 'niezgodności'} • {passCount}/{audit.items.length} zaliczonych
              </Text>
            </View>
            <View style={[styles.bigScore, { borderColor: scoreColor }]}>
              <Text style={[styles.bigScoreNum, { color: scoreColor }]}>{totalScore}</Text>
              <Text style={[styles.bigScorePct, { color: scoreColor }]}>%</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.exportBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
              exporting && { opacity: 0.6 },
            ]}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
            )}
            <Text style={styles.exportBtnText}>{exporting ? 'Generowanie PDF...' : 'Eksportuj raport PDF'}</Text>
          </Pressable>
        </View>

        {/* Wynik według filarów */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Wynik według filarów</Text>
        <View style={[styles.pillarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {pillars.map((p) => <ScoreBar key={p} pillar={p} score={audit.scores[p]} />)}
        </View>

        {/* Niezgodności */}
        {audit.nonConformances.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Niezgodności ({audit.nonConformances.length})
            </Text>
            {audit.nonConformances.map((nc) => {
              const info = PILLAR_LABELS[nc.pillar];
              const sColor = nc.severity === 'low' ? colors.success : nc.severity === 'medium' ? colors.warning : colors.error;
              return (
                <View key={nc.id} style={[styles.ncCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.ncBadges}>
                    <View style={[styles.badge, { backgroundColor: info.color + '20' }]}>
                      <Text style={[styles.badgeText, { color: info.color }]}>{nc.pillar}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sColor + '20' }]}>
                      <Text style={[styles.badgeText, { color: sColor }]}>{SEVERITY_LABELS[nc.severity]}</Text>
                    </View>
                  </View>
                  <Text style={[styles.ncDesc, { color: colors.foreground }]}>{nc.description}</Text>
                  {nc.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {nc.photos.map((uri, idx) => (
                        <Image key={idx} source={{ uri }} style={styles.ncPhoto} />
                      ))}
                    </ScrollView>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Lista kontrolna */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Lista kontrolna</Text>
        {pillars.map((p) => {
          const info = PILLAR_LABELS[p];
          const items = audit.items.filter((i) => i.pillar === p);
          return (
            <View key={p} style={[styles.checklistSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.checklistHeader, { borderBottomColor: colors.border }]}>
                <View style={[styles.pillarBadge, { backgroundColor: info.color + '20' }]}>
                  <Text style={[styles.pillarBadgeText, { color: info.color }]}>{p}</Text>
                </View>
                <Text style={[styles.checklistPillarName, { color: colors.foreground }]}>{info.name}</Text>
              </View>
              {items.map((item, idx) => {
                const statusColor = item.status === 'pass' ? colors.success : item.status === 'partial' ? colors.warning : item.status === 'fail' ? colors.error : colors.muted;
                const statusLabel = item.status === 'pass' ? '✓ OK' : item.status === 'partial' ? '~ Częściowo' : item.status === 'fail' ? '✗ Niezgodność' : '— Oczekuje';
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.checklistItem,
                      idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.checklistItemDesc, { color: colors.foreground }]}>{item.description}</Text>
                    <Text style={[styles.checklistItemStatus, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, gap: 14 },
  headerCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  areaName: { fontSize: 20, fontWeight: '800' },
  dateText: { fontSize: 13, marginTop: 2 },
  statsText: { fontSize: 13, marginTop: 4 },
  bigScore: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  bigScoreNum: { fontSize: 22, fontWeight: '900' },
  bigScorePct: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10 },
  exportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  pillarCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20, gap: 14 },
  scoreBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillarBadge: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  pillarBadgeText: { fontSize: 11, fontWeight: '800' },
  barInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barName: { fontSize: 13, fontWeight: '600' },
  barPct: { fontSize: 13, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  ncCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  ncBadges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  ncDesc: { fontSize: 14, lineHeight: 20 },
  ncPhoto: { width: 90, height: 90, borderRadius: 8, marginRight: 8 },
  checklistSection: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  checklistPillarName: { fontSize: 14, fontWeight: '700', flex: 1 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 8 },
  checklistItemDesc: { fontSize: 13, lineHeight: 18, flex: 1 },
  checklistItemStatus: { fontSize: 12, fontWeight: '700' },
});
