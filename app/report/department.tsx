import {
  View, Text, Pressable, FlatList, StyleSheet, Alert, ActivityIndicator, ScrollView
} from "react-native";
import { useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PILLAR_LABELS, Pillar, Audit, Department } from "@/lib/types";

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

async function generateDepartmentReportHTML(
  department: Department,
  audits: Audit[]
): Promise<string> {
  const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
  const scoreColor = (s: number) => s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#DC2626';
  const severityColor = (s: string) => s === 'low' ? '#16A34A' : s === 'medium' ? '#D97706' : '#DC2626';
  const severityLabel = (s: string) => s === 'low' ? 'NISKI' : s === 'medium' ? 'ŚREDNI' : 'WYSOKI';

  const now = new Date();
  const reportDate = now.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });

  // Oblicz statystyki zbiorcze
  const totalAudits = audits.length;
  const avgTotal = totalAudits > 0
    ? Math.round(audits.reduce((s, a) => s + a.scores.total, 0) / totalAudits)
    : 0;
  const totalNCs = audits.reduce((s, a) => s + a.nonConformances.length, 0);
  const avgByPillar: Record<Pillar, number> = { '1S': 0, '2S': 0, '3S': 0, '4S': 0, '5S': 0 };
  if (totalAudits > 0) {
    for (const p of pillars) {
      avgByPillar[p] = Math.round(audits.reduce((s, a) => s + a.scores[p], 0) / totalAudits);
    }
  }

  // Tabela podsumowania audytów
  const auditRows = audits.map((audit) => {
    const date = new Date(audit.completedAt || audit.startedAt);
    const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });
    const color = scoreColor(audit.scores.total);
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:600">${audit.zoneName}</td>
        <td style="padding:10px 12px;color:#64748b">${dateStr}</td>
        ${pillars.map(p => `<td style="padding:10px 12px;text-align:center;font-weight:700;color:${scoreColor(audit.scores[p])}">${audit.scores[p]}%</td>`).join('')}
        <td style="padding:10px 12px;text-align:center;font-weight:800;color:${color}">${audit.scores.total}%</td>
        <td style="padding:10px 12px;text-align:center">${audit.nonConformances.length}</td>
      </tr>`;
  }).join('');

  // Tabela średnich filarów
  const pillarSummaryRows = pillars.map((p) => {
    const info = PILLAR_LABELS[p];
    const avg = avgByPillar[p];
    const color = scoreColor(avg);
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:700;color:${info.color}">${p}</td>
        <td style="padding:10px 12px">${info.name}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:800;color:${color}">${avg}%</td>
        <td style="padding:10px 12px;width:200px">
          <div style="background:#e5e7eb;border-radius:4px;height:10px;overflow:hidden">
            <div style="width:${avg}%;height:100%;background:${color};border-radius:4px"></div>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Szczegóły każdego audytu z niezgodnościami
  const auditDetailSections = await Promise.all(audits.map(async (audit) => {
    if (audit.nonConformances.length === 0) return '';
    const date = new Date(audit.completedAt || audit.startedAt);
    const dateStr = date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });

    const ncItems = await Promise.all(audit.nonConformances.map(async (nc) => {
      const info = PILLAR_LABELS[nc.pillar];
      const sColor = severityColor(nc.severity);
      const photoImgs = await Promise.all(
        nc.photos.map(async (uri) => {
          const b64 = await imageUriToBase64(uri);
          return b64 ? `<img src="${b64}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:4px" />` : '';
        })
      );
      return `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px">
          <div style="display:flex;gap:8px;margin-bottom:6px">
            <span style="background:${info.color}20;color:${info.color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${nc.pillar}</span>
            <span style="background:${sColor}20;color:${sColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${severityLabel(nc.severity)}</span>
          </div>
          <p style="margin:0 0 6px;font-size:13px;line-height:1.5">${nc.description}</p>
          ${photoImgs.filter(Boolean).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${photoImgs.join('')}</div>` : ''}
        </div>`;
    }));

    return `
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <span style="font-size:15px;font-weight:700;color:#0f172a">${audit.zoneName}</span>
            <span style="font-size:13px;color:#64748b;margin-left:12px">${dateStr}</span>
          </div>
          <div style="width:48px;height:48px;border-radius:50%;border:3px solid ${scoreColor(audit.scores.total)};display:flex;align-items:center;justify-content:center;flex-direction:column">
            <span style="font-size:16px;font-weight:900;color:${scoreColor(audit.scores.total)}">${audit.scores.total}</span>
            <span style="font-size:10px;font-weight:700;color:${scoreColor(audit.scores.total)}">%</span>
          </div>
        </div>
        <p style="margin:0 0 10px;font-size:13px;color:#64748b">${audit.nonConformances.length} niezgodności</p>
        ${ncItems.join('')}
      </div>`;
  }));

  const totalColor = scoreColor(avgTotal);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; font-size: 14px; }
    h1 { font-size: 22px; font-weight: 900; color: #1A56DB; margin: 0 0 4px; }
    h2 { font-size: 15px; font-weight: 700; margin: 24px 0 10px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 14px; font-weight: 700; margin: 20px 0 8px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    td { border-bottom: 1px solid #f1f5f9; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .score-circle { width: 80px; height: 80px; border-radius: 50%; border: 4px solid ${totalColor}; display: flex; align-items: center; justify-content: center; flex-direction: column; flex-shrink: 0; }
    .score-num { font-size: 26px; font-weight: 900; color: ${totalColor}; }
    .score-pct { font-size: 12px; font-weight: 700; color: ${totalColor}; }
    .meta { font-size: 13px; color: #64748b; margin: 3px 0; }
    .stat-grid { display: flex; gap: 16px; margin-bottom: 20px; }
    .stat-card { flex: 1; background: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 22px; font-weight: 900; color: #1A56DB; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
    @media print { .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Zbiorczy Raport 5S — Dział</h1>
      <p class="meta" style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px">${department.name}</p>
      <p class="meta"><strong>Data raportu:</strong> ${reportDate}</p>
      <p class="meta"><strong>Liczba audytów:</strong> ${totalAudits}</p>
      <p class="meta"><strong>Strefy:</strong> ${department.zones.map(z => z.name).join(', ')}</p>
    </div>
    <div class="score-circle">
      <span class="score-num">${avgTotal}</span>
      <span class="score-pct">%</span>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${totalAudits}</div>
      <div class="stat-label">Audytów łącznie</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${totalColor}">${avgTotal}%</div>
      <div class="stat-label">Średni wynik 5S</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#DC2626">${totalNCs}</div>
      <div class="stat-label">Niezgodności łącznie</div>
    </div>
  </div>

  <h2>Wyniki według stref</h2>
  <table>
    <thead>
      <tr>
        <th>Strefa</th>
        <th>Data</th>
        ${pillars.map(p => `<th style="text-align:center">${p}</th>`).join('')}
        <th style="text-align:center">Łącznie</th>
        <th style="text-align:center">Niezg.</th>
      </tr>
    </thead>
    <tbody>${auditRows}</tbody>
  </table>

  <h2>Średnie wyniki według filarów 5S</h2>
  <table>
    <thead><tr><th>Filar</th><th>Nazwa</th><th>Średni wynik</th><th>Postęp</th></tr></thead>
    <tbody>${pillarSummaryRows}</tbody>
  </table>

  ${auditDetailSections.some(Boolean) ? `
  <h2 class="page-break">Szczegóły niezgodności według stref</h2>
  ${auditDetailSections.join('')}
  ` : ''}
</body>
</html>`;
}

async function generateFactoryReportHTML(
  departments: Department[],
  audits: Audit[]
): Promise<string> {
  const pillars: Pillar[] = ['1S', '2S', '3S', '4S', '5S'];
  const scoreColor = (s: number) => s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#DC2626';

  const now = new Date();
  const reportDate = now.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });

  const totalAudits = audits.length;
  const avgTotal = totalAudits > 0
    ? Math.round(audits.reduce((s, a) => s + a.scores.total, 0) / totalAudits)
    : 0;
  const totalNCs = audits.reduce((s, a) => s + a.nonConformances.length, 0);

  const avgByPillar: Record<Pillar, number> = { '1S': 0, '2S': 0, '3S': 0, '4S': 0, '5S': 0 };
  if (totalAudits > 0) {
    for (const p of pillars) {
      avgByPillar[p] = Math.round(audits.reduce((s, a) => s + a.scores[p], 0) / totalAudits);
    }
  }

  // Tabela wyników po działach
  const deptRows = departments.map((dept) => {
    const deptAudits = audits.filter((a) => a.departmentId === dept.id);
    if (deptAudits.length === 0) return '';
    const deptAvg = Math.round(deptAudits.reduce((s, a) => s + a.scores.total, 0) / deptAudits.length);
    const deptColor = scoreColor(deptAvg);
    const deptNCs = deptAudits.reduce((s, a) => s + a.nonConformances.length, 0);
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:600">${dept.name}</td>
        <td style="padding:10px 12px;text-align:center">${deptAudits.length}</td>
        ${pillars.map(p => {
          const deptPillarAvg = Math.round(deptAudits.reduce((s, a) => s + a.scores[p], 0) / deptAudits.length);
          return `<td style="padding:10px 12px;text-align:center;font-weight:700;color:${scoreColor(deptPillarAvg)}">${deptPillarAvg}%</td>`;
        }).join('')}
        <td style="padding:10px 12px;text-align:center;font-weight:800;color:${deptColor}">${deptAvg}%</td>
        <td style="padding:10px 12px;text-align:center">${deptNCs}</td>
      </tr>`;
  }).filter(Boolean).join('');

  const pillarSummaryRows = pillars.map((p) => {
    const info = PILLAR_LABELS[p];
    const avg = avgByPillar[p];
    const color = scoreColor(avg);
    return `
      <tr>
        <td style="padding:10px 12px;font-weight:700;color:${info.color}">${p}</td>
        <td style="padding:10px 12px">${info.name}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:800;color:${color}">${avg}%</td>
        <td style="padding:10px 12px;width:200px">
          <div style="background:#e5e7eb;border-radius:4px;height:10px;overflow:hidden">
            <div style="width:${avg}%;height:100%;background:${color};border-radius:4px"></div>
          </div>
        </td>
      </tr>`;
  }).join('');

  const totalColor = scoreColor(avgTotal);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; font-size: 14px; }
    h1 { font-size: 26px; font-weight: 900; color: #1A56DB; margin: 0 0 4px; }
    h2 { font-size: 15px; font-weight: 700; margin: 24px 0 10px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    td { border-bottom: 1px solid #f1f5f9; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .score-circle { width: 100px; height: 100px; border-radius: 50%; border: 4px solid ${totalColor}; display: flex; align-items: center; justify-content: center; flex-direction: column; flex-shrink: 0; }
    .score-num { font-size: 32px; font-weight: 900; color: ${totalColor}; }
    .score-pct { font-size: 14px; font-weight: 700; color: ${totalColor}; }
    .meta { font-size: 13px; color: #64748b; margin: 3px 0; }
    .stat-grid { display: flex; gap: 16px; margin-bottom: 20px; }
    .stat-card { flex: 1; background: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 24px; font-weight: 900; color: #1A56DB; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Zbiorczy Raport 5S — Całe Przedsiębiorstwo</h1>
      <p class="meta"><strong>Data raportu:</strong> ${reportDate}</p>
      <p class="meta"><strong>Liczba działów:</strong> ${departments.length}</p>
      <p class="meta"><strong>Liczba audytów:</strong> ${totalAudits}</p>
    </div>
    <div class="score-circle">
      <span class="score-num">${avgTotal}</span>
      <span class="score-pct">%</span>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${totalAudits}</div>
      <div class="stat-label">Audytów łącznie</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:${totalColor}">${avgTotal}%</div>
      <div class="stat-label">Średni wynik 5S</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#DC2626">${totalNCs}</div>
      <div class="stat-label">Niezgodności łącznie</div>
    </div>
  </div>

  <h2>Wyniki według działów</h2>
  <table>
    <thead>
      <tr>
        <th>Dział</th>
        <th style="text-align:center">Audyty</th>
        ${pillars.map(p => `<th style="text-align:center">${p}</th>`).join('')}
        <th style="text-align:center">Średnia</th>
        <th style="text-align:center">Niezg.</th>
      </tr>
    </thead>
    <tbody>${deptRows}</tbody>
  </table>

  <h2>Średnie wyniki według filarów 5S</h2>
  <table>
    <thead><tr><th>Filar</th><th>Nazwa</th><th>Średni wynik</th><th>Postęp</th></tr></thead>
    <tbody>${pillarSummaryRows}</tbody>
  </table>

  <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center">
    Wygenerowano przez aplikację Audyt 5S • ${new Date().toLocaleString('pl-PL')}
  </p>
</body>
</html>`;
}

export default function DepartmentReportScreen() {
  const { state } = useApp();
  const colors = useColors();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showFactoryReport, setShowFactoryReport] = useState(false);

  const completedAudits = state.audits.filter((a) => a.status === 'completed');

  const departmentsWithAudits = state.departments.map((dept) => {
    const deptAudits = completedAudits.filter((a) => a.departmentId === dept.id);
    const auditsByZone = new Map<string, Audit[]>();
    deptAudits.forEach((audit) => {
      if (!auditsByZone.has(audit.zoneId)) {
        auditsByZone.set(audit.zoneId, []);
      }
      auditsByZone.get(audit.zoneId)!.push(audit);
    });

    // Sprawdź czy wszystkie strefy mają audyty
    const allZonesHaveAudits = dept.zones.every((z) => auditsByZone.has(z.id) && auditsByZone.get(z.id)!.length > 0);

    const avgScore = deptAudits.length > 0
      ? Math.round(deptAudits.reduce((s, a) => s + a.scores.total, 0) / deptAudits.length)
      : null;
    const totalNCs = deptAudits.reduce((s, a) => s + a.nonConformances.length, 0);
    const lastAudit = deptAudits.sort((a, b) =>
      new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime()
    )[0];

    return { dept, audits: deptAudits, avgScore, totalNCs, lastAudit, allZonesHaveAudits, auditsByZone };
  }).filter((d) => d.audits.length > 0);

  const allDepartmentsComplete = departmentsWithAudits.length > 0 && 
    departmentsWithAudits.every((d) => d.allZonesHaveAudits);

  const handleGenerateReport = async (deptId: string) => {
    const entry = departmentsWithAudits.find((d) => d.dept.id === deptId);
    if (!entry) return;

    if (!entry.allZonesHaveAudits) {
      const missingZones = entry.dept.zones
        .filter((z) => !entry.auditsByZone.has(z.id) || entry.auditsByZone.get(z.id)!.length === 0)
        .map((z) => z.name)
        .join(', ');
      Alert.alert(
        'Niekompletne audyty',
        `Nie wszystkie strefy mają wykonane audyty.\n\nBrakujące strefy:\n${missingZones}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setGeneratingId(deptId);
    try {
      const html = await generateDepartmentReportHTML(entry.dept, entry.audits);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const fileName = `Raport_5S_${entry.dept.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: destUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: `Raport: ${entry.dept.name}` });
      } else {
        Alert.alert('PDF wygenerowany', `Plik zapisany: ${fileName}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu PDF.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateFactoryReport = async () => {
    if (!allDepartmentsComplete) {
      Alert.alert(
        'Niekompletne audyty',
        'Nie wszystkie działy mają kompletne audyty we wszystkich strefach. Najpierw uzupełnij brakujące audyty.',
        [{ text: 'OK' }]
      );
      return;
    }

    setGeneratingId('factory');
    try {
      const html = await generateFactoryReportHTML(state.departments, completedAudits);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const fileName = `Raport_5S_Zaklad_${new Date().toISOString().slice(0, 10)}.pdf`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: destUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: 'Raport: Całe Przedsiębiorstwo' });
      } else {
        Alert.alert('PDF wygenerowany', `Plik zapisany: ${fileName}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu PDF.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Raporty zbiorcze</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>Generuj PDF dla działów i całego zakładu</Text>
      </View>

      {/* Przycisk raportu całego zakładu */}
      {departmentsWithAudits.length > 0 && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <Pressable
            style={({ pressed }) => [
              styles.factoryReportBtn,
              {
                backgroundColor: allDepartmentsComplete ? colors.primary : colors.border,
              },
              pressed && allDepartmentsComplete && { opacity: 0.85 },
            ]}
            onPress={handleGenerateFactoryReport}
            disabled={generatingId === 'factory' || !allDepartmentsComplete}
          >
            {generatingId === 'factory' ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.factoryReportBtnText}>Generowanie PDF...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="building.2.fill" size={18} color={allDepartmentsComplete ? '#fff' : colors.muted} />
                <Text style={[styles.factoryReportBtnText, { color: allDepartmentsComplete ? '#fff' : colors.muted }]}>
                  Raport całego zakładu
                </Text>
              </>
            )}
          </Pressable>
          {!allDepartmentsComplete && (
            <Text style={[styles.warningText, { color: colors.warning }]}>
              ⚠ Nie wszystkie działy mają kompletne audyty
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={departmentsWithAudits}
        keyExtractor={(item) => item.dept.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const { dept, audits, avgScore, totalNCs, lastAudit, allZonesHaveAudits, auditsByZone } = item;
          const isGenerating = generatingId === dept.id;
          const scoreColor = avgScore !== null
            ? (avgScore >= 80 ? colors.success : avgScore >= 60 ? colors.warning : colors.error)
            : colors.muted;
          const lastDate = lastAudit
            ? new Date(lastAudit.completedAt || lastAudit.startedAt).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })
            : null;

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.deptName, { color: colors.foreground }]}>{dept.name}</Text>
                  <View style={styles.metaRow}>
                    <IconSymbol name="doc.text.fill" size={13} color={colors.muted} />
                    <Text style={[styles.metaText, { color: colors.muted }]}>
                      {audits.length} {audits.length === 1 ? 'audyt' : audits.length < 5 ? 'audyty' : 'audytów'}
                    </Text>
                  </View>
                  {lastDate && (
                    <View style={styles.metaRow}>
                      <IconSymbol name="clock.fill" size={13} color={colors.muted} />
                      <Text style={[styles.metaText, { color: colors.muted }]}>Ostatni: {lastDate}</Text>
                    </View>
                  )}
                  <View style={styles.metaRow}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={13} color={colors.muted} />
                    <Text style={[styles.metaText, { color: colors.muted }]}>{totalNCs} niezgodności łącznie</Text>
                  </View>
                </View>
                {avgScore !== null && (
                  <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                    <Text style={[styles.scoreNum, { color: scoreColor }]}>{avgScore}</Text>
                    <Text style={[styles.scorePct, { color: scoreColor }]}>%</Text>
                  </View>
                )}
              </View>

              {/* Strefy */}
              <View style={styles.zonesRow}>
                {dept.zones.map((z) => {
                  const zoneAudits = auditsByZone.get(z.id) || [];
                  const hasAudit = zoneAudits.length > 0;
                  return (
                    <View
                      key={z.id}
                      style={[
                        styles.zoneBadge,
                        {
                          backgroundColor: hasAudit ? colors.primary + '15' : colors.error + '15',
                        },
                      ]}
                    >
                      <Text style={[styles.zoneBadgeText, { color: hasAudit ? colors.primary : colors.error }]}>
                        {z.name} {hasAudit ? `✓` : '✗'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.exportBtn,
                  {
                    backgroundColor: allZonesHaveAudits && !isGenerating ? colors.primary : colors.border,
                  },
                  pressed && allZonesHaveAudits && !isGenerating && { opacity: 0.85 },
                ]}
                onPress={() => handleGenerateReport(dept.id)}
                disabled={isGenerating || !allZonesHaveAudits}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.exportBtnText}>Generowanie PDF...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol
                      name="arrow.down.doc.fill"
                      size={18}
                      color={allZonesHaveAudits ? '#fff' : colors.muted}
                    />
                    <Text style={[styles.exportBtnText, { color: allZonesHaveAudits ? '#fff' : colors.muted }]}>
                      Eksportuj raport PDF
                    </Text>
                  </>
                )}
              </Pressable>

              {!allZonesHaveAudits && (
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ⚠ Brakuje audytów w niektórych strefach
                </Text>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="chart.bar.fill" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Brak danych</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Zakończ audyty we wszystkich strefach działów, aby wygenerować raporty zbiorcze.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 4 },
  factoryReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginBottom: 8 },
  factoryReportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  warningText: { fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardInfo: { flex: 1, gap: 5 },
  deptName: { fontSize: 17, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 18, fontWeight: '900' },
  scorePct: { fontSize: 11, fontWeight: '700' },
  zonesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  zoneBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  zoneBadgeText: { fontSize: 12, fontWeight: '600' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10 },
  exportBtnText: { fontSize: 15, fontWeight: '700' },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
