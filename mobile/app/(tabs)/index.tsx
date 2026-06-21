import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useColorScheme } from "@/components/useColorScheme";
import { ActionButton, MetricCard } from "@/components/DevRoomUI";
import Colors, { brand } from "@/constants/Colors";
import { useThemeStyles } from "@/constants/theme";
import { getHealth, listPriorities, sendCeoCommand } from "@/lib/api";
import { useDevRoom } from "@/lib/DevRoomContext";
import type { HealthResponse, Priority } from "@/lib/types";

const PROJECTS = [
  "VaultCap",
  "PulseCap",
  "PrismCap",
  "SteadyCap",
  "LedgerCap",
  "DeePonyCap",
  "ScentCap",
  "AuraCap",
];

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const s = useThemeStyles(scheme);
  const { baseUrl, token } = useDevRoom();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const [projectId, setProjectId] = useState("VaultCap");
  const [delegating, setDelegating] = useState(false);
  const [delegateMsg, setDelegateMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [h, p] = await Promise.all([
        getHealth(baseUrl, token || undefined),
        listPriorities(baseUrl, token || undefined).catch(() => ({ priorities: [] as Priority[] })),
      ]);
      setHealth(h);
      setPriorities(p.priorities.slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  async function delegate() {
    if (!command.trim()) return;
    setDelegating(true);
    setDelegateMsg(null);
    try {
      const res = await sendCeoCommand(baseUrl, command.trim(), projectId, token || undefined);
      setDelegateMsg(res.message || "Delegated to office.");
      setCommand("");
      await load();
    } catch (e) {
      setDelegateMsg(e instanceof Error ? e.message : "Delegate failed");
    } finally {
      setDelegating(false);
    }
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={c.tint} />}>
      <Text style={s.label}>{brand.name}</Text>
      <Text style={s.title}>Command Center</Text>
      <Text style={s.subtitle}>Connected to {baseUrl}</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {health ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
          <MetricCard
            label="CAP APPS"
            value={health.sandboxes?.length ?? 8}
            hint={`v${health.version}`}
          />
          <MetricCard
            label="PENDING APPROVALS"
            value={health.pendingApprovals}
            tone={health.pendingApprovals > 0 ? "err" : "ok"}
          />
          <MetricCard
            label="DATABASE"
            value={health.database === "ok" ? "OK" : "—"}
            tone={health.database === "ok" ? "ok" : "err"}
          />
          <MetricCard
            label="CURSOR API"
            value={health.cursorApi === "configured" ? "READY" : "—"}
            tone={health.cursorApi === "configured" ? "ok" : "warn"}
          />
        </View>
      ) : loading ? (
        <ActivityIndicator color={c.tint} style={{ marginTop: 32 }} />
      ) : null}

      <View style={[s.card, { marginTop: 20 }]}>
        <Text style={s.label}>CEO Command · APEX</Text>
        <TextInput
          style={[s.input, { minHeight: 88, textAlignVertical: "top", marginBottom: 10 }]}
          placeholder="Tell APEX what you need…"
          placeholderTextColor={c.textMuted}
          multiline
          value={command}
          onChangeText={setCommand}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {PROJECTS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setProjectId(p)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: projectId === p ? c.tint : c.card,
                borderWidth: 1,
                borderColor: projectId === p ? c.tint : c.border,
              }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: projectId === p ? "#0a0a0c" : c.text,
                }}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
        <ActionButton title={delegating ? "Delegating…" : "Delegate to office"} onPress={delegate} disabled={delegating} />
        {delegateMsg ? <Text style={[s.subtitle, { marginTop: 10 }]}>{delegateMsg}</Text> : null}
      </View>

      {priorities.length > 0 ? (
        <View style={s.card}>
          <Text style={s.label}>Today&apos;s priorities</Text>
          {priorities.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <SymbolView
                name={{ ios: p.done ? "checkmark.circle.fill" : "circle", android: "check", web: "check" }}
                tintColor={p.done ? c.ok : c.textMuted}
                size={18}
              />
              <Text
                style={{
                  flex: 1,
                  color: p.done ? c.textMuted : c.text,
                  textDecorationLine: p.done ? "line-through" : "none",
                  fontSize: 14,
                  lineHeight: 20,
                }}>
                {p.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
