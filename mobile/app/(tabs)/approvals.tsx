import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import { ActionButton, RiskBadge } from "@/components/DevRoomUI";
import Colors from "@/constants/Colors";
import { useThemeStyles } from "@/constants/theme";
import { listApprovals, patchApproval } from "@/lib/api";
import { useDevRoom } from "@/lib/DevRoomContext";
import type { Approval } from "@/lib/types";

export default function ApprovalsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const s = useThemeStyles(scheme);
  const { baseUrl, token } = useDevRoom();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await listApprovals(baseUrl, token || undefined);
      setApprovals(res.approvals);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, status: "approved" | "rejected") {
    setActing(id);
    try {
      const res = await patchApproval(baseUrl, id, status, token || undefined);
      Alert.alert(
        status === "approved" ? "Approved" : "Rejected",
        res.run?.message || `Approval ${status}.`
      );
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.tint} />}>
      <Text style={s.label}>Approvals</Text>
      <Text style={s.title}>{pending.length} pending</Text>
      <Text style={s.subtitle}>Approve to launch the agent in your Mac sandbox.</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {loading && !approvals.length ? <ActivityIndicator color={c.tint} style={{ marginTop: 24 }} /> : null}

      {pending.map((a) => (
        <View key={a.id} style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <RiskBadge risk={a.risk} />
            <Text style={{ fontSize: 12, color: c.textMuted }}>{a.agent} · {a.projectId}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 6 }}>{a.title}</Text>
          <Text style={{ fontSize: 13, color: c.textMuted, lineHeight: 19, marginBottom: 12 }} numberOfLines={4}>
            {a.description}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ActionButton
                title={acting === a.id ? "…" : "Approve & run"}
                onPress={() => act(a.id, "approved")}
                disabled={acting === a.id}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton
                title="Reject"
                variant="ghost"
                onPress={() => act(a.id, "rejected")}
                disabled={acting === a.id}
              />
            </View>
          </View>
        </View>
      ))}

      {!loading && pending.length === 0 ? (
        <Text style={[s.subtitle, { marginTop: 16 }]}>No pending approvals.</Text>
      ) : null}
    </ScrollView>
  );
}
