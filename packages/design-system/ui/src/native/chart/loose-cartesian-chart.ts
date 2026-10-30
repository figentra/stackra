/**
 * Stackra file contract:
 * Purpose: `LooseCartesianChart`, Victory Native's `CartesianChart` typed for rows whose keys are known only at run
 *          time, with the render arguments the native charts read (points, bounds and the value scale).
 * Boundary: a type cast only; Victory's generics need the row's keys at compile time, which a chart's props do not give.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ReactElement, ReactNode } from "react";
import { type ChartBounds, CartesianChart, type PointsArray } from "victory-native";

/** Victory's chart with loose row typing. */
export const LooseCartesianChart = CartesianChart as unknown as (props: {
  readonly children: (args: {
    readonly points: Record<string, PointsArray>;
    readonly chartBounds: ChartBounds;
    readonly yScale: (value: number) => number;
  }) => ReactNode;
  readonly [prop: string]: unknown;
}) => ReactElement;
