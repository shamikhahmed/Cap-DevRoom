import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_BASE = "@devroom/baseUrl";
const STORAGE_TOKEN = "@devroom/token";

type DevRoomContextValue = {
  baseUrl: string;
  token: string;
  configured: boolean;
  setBaseUrl: (url: string) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  refreshConfig: () => Promise<void>;
};

const DevRoomContext = createContext<DevRoomContextValue | null>(null);

export function DevRoomProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState("http://127.0.0.1:3000");
  const [token, setTokenState] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refreshConfig = useCallback(async () => {
    const [storedUrl, storedToken] = await Promise.all([
      AsyncStorage.getItem(STORAGE_BASE),
      AsyncStorage.getItem(STORAGE_TOKEN),
    ]);
    if (storedUrl) setBaseUrlState(storedUrl);
    if (storedToken) setTokenState(storedToken);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const setBaseUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    setBaseUrlState(trimmed);
    await AsyncStorage.setItem(STORAGE_BASE, trimmed);
  }, []);

  const setToken = useCallback(async (value: string) => {
    setTokenState(value.trim());
    await AsyncStorage.setItem(STORAGE_TOKEN, value.trim());
  }, []);

  const value = useMemo(
    () => ({
      baseUrl,
      token,
      configured: loaded && baseUrl.length > 0,
      setBaseUrl,
      setToken,
      refreshConfig,
    }),
    [baseUrl, token, loaded, setBaseUrl, setToken, refreshConfig]
  );

  if (!loaded) return null;

  return <DevRoomContext.Provider value={value}>{children}</DevRoomContext.Provider>;
}

export function useDevRoom() {
  const ctx = useContext(DevRoomContext);
  if (!ctx) throw new Error("useDevRoom must be used within DevRoomProvider");
  return ctx;
}
