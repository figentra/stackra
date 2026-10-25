/**
 * Stackra file contract:
 * Purpose: the native `useNavigate()`: `navigate.to(Routes.order_detail, { orderId })`, `navigate.replace(...)`,
 *          `navigate.back()` over React Navigation, with the route key as the screen name gen registered.
 * Boundary: wraps React Navigation's navigation object; stable while it is.
 * Runtime: react-native
 * Governing contract: ADR 0165 (code-based React Navigation; expo-router rejected); ADR 0294 (decision 20).
 */
import {
  StackActions,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import { useMemo } from "react";

import type { NativeNavigate } from "#native/navigate/native-navigate.type";

/**
 * Navigation by route ref.
 *
 * @throws Error outside a React Navigation navigator.
 * @example
 * navigate = useNavigate();
 * this.navigate.to(Routes.create_order);
 */
export function useNavigate(): NativeNavigate {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  return useMemo<NativeNavigate>(
    () => ({
      to: (route, params) => navigation.navigate(route.name, params),
      replace: (route, params) => navigation.dispatch(StackActions.replace(route.name, params)),
      back: () => navigation.goBack(),
    }),
    [navigation],
  );
}
