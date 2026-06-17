import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import { ActionButton } from "@/components/DevRoomUI";
import Colors, { brand } from "@/constants/Colors";
import { useThemeStyles } from "@/constants/theme";
import { getHealth, getNetwork } from "@/lib/api";
import { useDevRoom } from "@/lib/DevRoomContext";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme === "light" ? "light" : "dark"];
  const s = useThemeStyles(scheme);
  const { baseUrl, token, setBaseUrl, setToken } = useDevRoom();
  const [urlDraft, setUrlDraft] = useState(baseUrl);
  const [tokenDraft, setTokenDraft] = useState(token);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [lanHint, setLanHint] = useState<string | null>(null);

  const save = useCallback(async () => {
    await setBaseUrl(urlDraft);
    await setToken(tokenDraft);
    Alert.alert("Saved", "Connection settings updated.");
  }, [urlDraft, tokenDraft, setBaseUrl, setToken]);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const health = await getHealth(urlDraft, tokenDraft || undefined);
      setTestResult(`Connected · v${health.version} · ${health.pendingApprovals} pending approvals`);
      try {
        const net = await getNetwork(urlDraft, tokenDraft || undefined);
        if (net.lan) setLanHint(`Mac LAN URL: ${net.lan}`);
      } catch {
        /* optional */
      }
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  }

  function useLanExample() {
    setUrlDraft("http://192.168.18.72:3000");
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <Text style={s.label}>Setup</Text>
      <Text style={s.title}>Connection</Text>
      <Text style={s.subtitle}>
        Point this app at your Mac running Cap · DevRoom. Same Wi‑Fi required for LAN access.
      </Text>

      <View style={[s.card, { marginTop: 20 }]}>
        <Text style={[s.label, { marginBottom: 12 }]}>Server URL</Text>
        <TextInput
          style={s.input}
          value={urlDraft}
          onChangeText={setUrlDraft}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://192.168.x.x:3000"
          placeholderTextColor={c.textMuted}
        />
        <Text style={[s.subtitle, { marginTop: 8 }]}>
          Use your Mac&apos;s LAN IP from DevRoom Settings, not localhost, on a physical iPhone.
        </Text>
        <View style={{ marginTop: 12 }}>
          <ActionButton title="Use example LAN IP" variant="ghost" onPress={useLanExample} />
        </View>
      </View>

      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 12 }]}>API token (optional)</Text>
        <TextInput
          style={s.input}
          value={tokenDraft}
          onChangeText={setTokenDraft}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="DEVROOM_API_TOKEN"
          placeholderTextColor={c.textMuted}
        />
        <Text style={[s.subtitle, { marginTop: 8 }]}>
          Required when DEVROOM_API_TOKEN is set in dashboard/.env.local for LAN access.
        </Text>
      </View>

      <ActionButton title={testing ? "Testing…" : "Test connection"} onPress={testConnection} disabled={testing} />
      <View style={{ marginTop: 10 }}>
        <ActionButton title="Save settings" variant="ghost" onPress={save} />
      </View>

      {testResult ? (
        <Text
          style={[
            s.subtitle,
            { marginTop: 16, color: testResult.startsWith("Connected") ? c.ok : c.err },
          ]}>
          {testResult}
        </Text>
      ) : null}
      {lanHint ? <Text style={[s.subtitle, { marginTop: 8 }]}>{lanHint}</Text> : null}

      <View style={[s.card, { marginTop: 24 }]}>
        <Text style={s.label}>About</Text>
        <Text style={{ color: c.text, fontSize: 15, marginTop: 4 }}>{brand.name} Mobile</Text>
        <Text style={s.subtitle}>v{brand.version} · pairs with dashboard v3.1.0+</Text>
      </View>
    </ScrollView>
  );
}
