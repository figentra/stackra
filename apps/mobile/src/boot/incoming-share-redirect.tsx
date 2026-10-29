/**
 * Stackra file contract:
 * Purpose: `IncomingShareRedirect`, which opens the share inbox when photos, PDFs, links or text arrive from another
 *          app while no link did it: the Android share target, and a share that reaches the app already open.
 * Boundary: renders nothing; mounted inside the navigation container once it is ready, so `navigate` always lands.
 *           It never reads an item's value; the inbox screen keeps, uploads and clears them.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 9); ADR 0255; ADR 0007 (documentation).
 */
import { useNavigation } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";
import { useIncomingShare } from "@stackra/native-share/react";
import { useEffect } from "react";

import type { RootStackParamList } from "../navigation/root-stack-param-list.type";

/** Opens the share inbox each time shared items are waiting and it is not already on screen. */
export function IncomingShareRedirect() {
  const { items } = useIncomingShare();
  // Outside every navigator, `useNavigation` answers the container's own ref.
  const navigation = useNavigation<NavigationContainerRef<RootStackParamList>>();

  useEffect(() => {
    if (items.length > 0 && navigation.getCurrentRoute()?.name !== "ShareInbox")
      navigation.navigate("ShareInbox");
  }, [items, navigation]);

  return null;
}
