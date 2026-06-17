import { StyleSheet } from "react-native";
import Colors from "./Colors";

export function useThemeStyles(scheme: "light" | "dark" | null | undefined) {
  const c = Colors[scheme === "light" ? "light" : "dark"];
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 28, fontWeight: "800", color: c.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: c.textMuted, marginTop: 4, lineHeight: 20 },
    label: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: c.tint,
      marginBottom: 8,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 12,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    btn: {
      backgroundColor: c.tint,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: "center",
    },
    btnText: { color: "#0a0a0c", fontWeight: "700", fontSize: 15 },
    btnGhost: {
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    btnGhostText: { color: c.text, fontWeight: "600", fontSize: 14 },
    input: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 12,
      color: c.text,
      fontSize: 15,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      overflow: "hidden",
    },
    badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
    error: { color: c.err, fontSize: 13, marginTop: 8 },
    ok: { color: c.ok },
  });
}
