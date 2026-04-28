import { View, Text, Pressable, FlatList, StyleSheet, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Department, Zone } from "@/lib/types";

export default function AreaSelectScreen() {
  const { state, startAudit } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
  };

  const handleSelectZone = (zone: Zone, dept: Department) => {
    const audit = startAudit(dept.id, dept.name, zone.id, zone.name);
    router.push(`/audit/checklist?auditId=${audit.id}` as any);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
  };

  // Show zone selection if department is selected
  if (selectedDepartment) {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]}>
        <FlatList
          data={selectedDepartment.zones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListHeaderComponent={
            <View>
              <Pressable
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
                onPress={handleBackToDepartments}
              >
                <IconSymbol name="chevron.left" size={20} color={colors.primary} />
                <Text style={[styles.backBtnText, { color: colors.primary }]}>Wróć do działów</Text>
              </Pressable>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                {selectedDepartment.name}
              </Text>
              <Text style={[styles.subheading, { color: colors.muted }]}>
                Wybierz strefę do audytu
              </Text>
            </View>
          }
          renderItem={({ item: zone }) => (
            <Pressable
              style={({ pressed }) => [
                styles.zoneCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => handleSelectZone(zone, selectedDepartment)}
            >
              <View style={styles.zoneCardContent}>
                <IconSymbol name="mappin.circle.fill" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneName, { color: colors.foreground }]}>{zone.name}</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </ScreenContainer>
    );
  }

  // Show department selection
  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <FlatList
        data={state.departments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.heading, { color: colors.foreground }]}>Wybierz dział</Text>
            <Text style={[styles.subheading, { color: colors.muted }]}>
              Wybierz dział, w którym chcesz przeprowadzić audyt
            </Text>
          </View>
        }
        renderItem={({ item: dept }) => (
          <Pressable
            style={({ pressed }) => [
              styles.departmentCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => handleSelectDepartment(dept)}
          >
            <View style={styles.deptCardContent}>
              <View
                style={[
                  styles.deptIcon,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <IconSymbol name="building.2.fill" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.deptName, { color: colors.foreground }]}>
                  {dept.name}
                </Text>
                <Text style={[styles.zoneCount, { color: colors.muted }]}>
                  {dept.zones.length} {dept.zones.length === 1 ? 'strefa' : 'strefy'}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginBottom: 12 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  deptCardContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  deptIcon: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deptName: { fontSize: 16, fontWeight: '700' },
  zoneCount: { fontSize: 13, marginTop: 2 },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  zoneCardContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  zoneName: { fontSize: 15, fontWeight: '600' },
});
