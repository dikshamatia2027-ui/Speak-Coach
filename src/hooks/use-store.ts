import { useSyncExternalStore } from "react";
import { store } from "@/lib/speakcoach";

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
