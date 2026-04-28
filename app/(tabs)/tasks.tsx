import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Task, PILLAR_LABELS } from "@/lib/types";

type FilterTab = 'all' | 'open' | 'in_progress' | 'done';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'open', label: 'Otwarte' },
  { key: 'in_progress', label: 'W toku' },
  { key: 'done', label: 'Zakończone' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Otwarte',
  in_progress: 'W toku',
  done: 'Zakończone',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'NISKI',
  medium: 'ŚREDNI',
  high: 'WYSOKI',
};

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const colors = useColors();
  const sColor = task.severity === 'low' ? colors.success : task.severity === 'medium' ? colors.warning : colors.error;
  const statusColor = task.status === 'done' ? colors.success : task.status === 'in_progress' ? colors.primary : colors.warning;
  const pillarInfo = PILLAR_LABELS[task.pillar];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.taskCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        task.status === 'done' && { opacity: 0.7 },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={styles.taskCardTop}>
        <View style={styles.taskCardBadges}>
          <View style={[styles.badge, { backgroundColor: pillarInfo.color + '20' }]}>
            <Text style={[styles.badgeText, { color: pillarInfo.color }]}>{task.pillar}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sColor + '20' }]}>
            <Text style={[styles.badgeText, { color: sColor }]}>{SEVERITY_LABELS[task.severity]}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{STATUS_LABELS[task.status]}</Text>
        </View>
      </View>

      <Text style={[styles.taskTitle, { color: colors.foreground }]} numberOfLines={2}>
        {task.title}
      </Text>

      <View style={styles.taskCardBottom}>
        <View style={styles.taskMeta}>
          <IconSymbol name={"mappin.fill" as any} size={13} color={colors.muted} />
          <Text style={[styles.taskMetaText, { color: colors.muted }]}>{task.departmentName ? `${task.departmentName} › ${task.zoneName}` : 'Nieznany obszar'}</Text>
        </View>
        {task.dueDate && (
          <View style={styles.taskMeta}>
            <IconSymbol name="clock.fill" size={13} color={colors.muted} />
            <Text style={[styles.taskMetaText, { color: colors.muted }]}>
              {new Date(task.dueDate).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })}
            </Text>
          </View>
        )}
        {task.photos.length > 0 && (
          <View style={styles.taskMeta}>
            <IconSymbol name="camera.fill" size={13} color={colors.muted} />
            <Text style={[styles.taskMetaText, { color: colors.muted }]}>{task.photos.length}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function TasksScreen() {
  const { state } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredTasks = state.tasks
    .filter((t) => activeFilter === 'all' || t.status === activeFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openCount = state.tasks.filter((t) => t.status === 'open').length;
  const inProgressCount = state.tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <ScreenContainer>
      {/* Nagłówek */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Zadania</Text>
        <View style={styles.headerStats}>
          {openCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.countBadgeText, { color: colors.warning }]}>{openCount} otwarte</Text>
            </View>
          )}
          {inProgressCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>{inProgressCount} w toku</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filtry */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [
                styles.filterTab,
                active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterTabText, { color: active ? colors.primary : colors.muted }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => router.push(`/task/${item.id}` as any)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {activeFilter === 'done' ? 'Brak zakończonych zadań' : 'Brak zadań!'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {activeFilter === 'all'
                ? 'Zadania są tworzone automatycznie podczas rejestrowania niezgodności w audycie.'
                : 'Brak zadań w tej kategorii.'}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerStats: { flexDirection: 'row', gap: 8, marginTop: 6 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  taskCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  taskCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskCardBadges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  taskTitle: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  taskCardBottom: { flexDirection: 'row', gap: 12 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 12 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 12, borderWidth: 1, gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
