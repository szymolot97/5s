import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AuditTab() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="p-6">
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
          <IconSymbol name="clipboard.fill" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Rozpocznij audyt 5S</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Wybierz obszar zakładu i przeprowadź ustrukturyzowany audyt 5S. Rejestruj niezgodności ze zdjęciami i automatycznie twórz zadania.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.push('/audit/area-select' as any)}
        >
          <IconSymbol name="plus.circle.fill" size={22} color="#fff" />
          <Text style={styles.buttonText}>Wybierz obszar i rozpocznij</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 8 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14, marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
