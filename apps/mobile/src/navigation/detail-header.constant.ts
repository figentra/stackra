/**
 * Stackra file contract:
 * Purpose: `detailHeader`: pages pushed from a tab root keep the glass header and the small title, so the large title
 *          stays on roots.
 * Boundary: native-stack options only, in their own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0305 (rule 10).
 */
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import { glassHeader } from "./header-options";

/** Pages pushed from a tab root keep the glass header and the small title, so the large title stays on roots. */
export const detailHeader: NativeStackNavigationOptions = {
  ...glassHeader,
  headerLargeTitle: false,
};
