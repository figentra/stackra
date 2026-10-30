# Third-party notices

<!--
Stackra file contract:
Purpose: the third-party code ported into this repository (ADR 0291, `.agents/rules/third-party-sources.md` rule 3):
         each source, its licence, its upstream commit and the files that carry portions of it.
Boundary: ported source only; dependencies are listed by their own manifests and checked by ADR 0174's allow-list.
Runtime: none
Governing contract: ADR 0291; ADR 0174.
-->

Each file listed here keeps a header naming its upstream source. The licence texts follow each entry.

## shadcn/ui

- Source: https://github.com/shadcn-ui/ui, commit `96da9cc7f1aa10580a3741664e2a77c721206c00`
- Upstream paths: `apps/v4/registry/new-york-v4/ui/chart.tsx` (ChartTooltipContent, ChartLegendContent) and
  `apps/v4/registry/new-york-v4/charts/*` (the area, bar, line, pie, radar and radial chart blocks)
- Licence: MIT
- Ported into `packages/design-system/ui/src/react/`:
  - `chart-tooltip/chart-tooltip.tsx`
  - `chart-legend/chart-legend.tsx`
  - `chart/centre-label.tsx`
  - `chart/pie-figure.tsx`
  - `area-chart/area-chart.tsx`
  - `bar-chart/bar-chart.tsx`
  - `line-chart/line-chart.tsx`
  - `radar-chart/radar-chart.tsx`
  - `radial-bar-chart/radial-bar-chart.tsx`
- Changes: the per-chart `<style>` tag and Tailwind selectors over Recharts' classes are replaced by theme colours
  passed as SVG presentation attributes (`var(--chart-<n>)`); a series config replaces the composable container;
  values and categories are written in the locale; axes follow the reading direction; a data table carries the
  numbers for assistive technology.

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
