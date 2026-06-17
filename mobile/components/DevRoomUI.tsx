import { Pressable, Text, View } from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useThemeStyles } from "@/constants/theme";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "err";
};

export function MetricCard({ label, value, hint, tone = "default" }: Props) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const s = useThemeStyles(scheme);
  const border =
    tone === "ok" ? c.ok : tone === "warn" ? c.warn : tone === "err" ? c.err : c.border;

  return (
    <View style={[s.card, { flex: 1, minWidth: "45%", borderColor: border }]}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: "700", color: c.textMuted, marginTop: 4 }}>
        {label}
      </Text>
      {hint ? (
        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

type BtnProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
};

export function ActionButton({ title, onPress, variant = "primary", disabled }: BtnProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const s = useThemeStyles(scheme);
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        isPrimary ? s.btn : s.btnGhost,
        isDanger && { backgroundColor: c.err, borderColor: c.err },
        disabled && { opacity: 0.5 },
      ]}>
      <Text
        style={[
          isPrimary || isDanger ? s.btnText : s.btnGhostText,
          isDanger && { color: "#fff" },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const bg =
    risk === "High" ? "rgba(255,69,58,0.15)" : risk === "Medium" ? "rgba(201,162,39,0.2)" : "rgba(48,209,88,0.15)";
  const color = risk === "High" ? c.err : risk === "Medium" ? c.tint : c.ok;

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color }}>{risk.toUpperCase()}</Text>
    </View>
  );
}
