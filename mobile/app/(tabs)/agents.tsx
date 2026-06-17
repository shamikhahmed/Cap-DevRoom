import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useThemeStyles } from "@/constants/theme";
import { getRoster } from "@/lib/api";
import { useDevRoom } from "@/lib/DevRoomContext";
import type { AgentRosterEntry } from "@/lib/types";

function statusColor(status: string, c: { ok: string; tint: string; textMuted: string }) {
  if (status === "active") return c.ok;
  if (status === "idle") return c.tint;
  return c.textMuted;
}

export default function AgentsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const s = useThemeStyles(scheme);
  const { baseUrl, token } = useDevRoom();
  const [roster, setRoster] = useState<AgentRosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getRoster(baseUrl, token || undefined);
      setRoster(res.roster);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.tint} />}>
      <Text style={s.label}>Agents</Text>
      <Text style={s.title}>Engineering office</Text>
      <Text style={s.subtitle}>{roster.length} codename agents · token salaries from live jobs</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {loading && !roster.length ? <ActivityIndicator color={c.tint} style={{ marginTop: 24 }} /> : null}

      {roster.map((agent) => (
        <View key={agent.codename} style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: c.text }}>{agent.name}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted }}>{agent.codename} · {agent.jobTitle}</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor(agent.liveStatus, c) }}>
              {agent.liveStatus.toUpperCase()}
            </Text>
          </View>
          <View
            style={{
              marginTop: 10,
              backgroundColor: "rgba(201,162,39,0.12)",
              padding: 8,
              borderRadius: 8,
            }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: c.tint }}>
              {agent.salary.tokens.toLocaleString()} tokens · ${agent.salary.cost.toFixed(4)} · {agent.salary.runs} runs
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 8, lineHeight: 18 }}>
            {agent.department}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
