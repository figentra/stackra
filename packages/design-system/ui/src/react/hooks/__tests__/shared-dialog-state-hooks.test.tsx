/**
 * Stackra file contract:
 * Purpose: proves the dialog and provider state the web and native components share: `useExportDialogState`
 *          (defaults, choices, a done export that closes, a failed one, the reopening reset), `useImportDialogState`
 *          (read, match, check, import, a failure and its retry, closing back to the upload step) and
 *          `useDesignSystemState` (own values and setters, controlled values, the platform's motion and scheme).
 * Boundary: the hooks through `renderHook` in jsdom, without an i18n provider; the app's handlers are stand-ins.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import type { ImportDryRun } from "#contracts/types/import-dry-run.type";
import type { ImportPreview } from "#contracts/types/import-preview.type";
import { useDesignSystemState } from "#react/hooks/use-design-system-state";
import { useExportDialogState } from "#react/hooks/use-export-dialog-state";
import { useImportDialogState } from "#react/hooks/use-import-dialog-state";

describe("useExportDialogState", () => {
  const formats = [
    { value: "csv", label: "CSV" },
    { value: "xlsx", label: "Excel" },
  ];
  const columns = [
    { value: "name", label: "Name" },
    { value: "sku", label: "SKU" },
  ];

  it("starts from the first format, every column, the first scope with rows and the first delivery", () => {
    const { result } = renderHook(() =>
      useExportDialogState({
        formats,
        columns,
        counts: { selection: 0, all: 40 },
        deliveries: ["download", "email"],
        email: "a@example.com",
        onExport: vi.fn(),
      }),
    );
    expect(result.current).toMatchObject({
      format: "csv",
      chosen: ["name", "sku"],
      scope: "all",
      delivery: "download",
      scopes: ["selection", "all"],
      open: false,
      phase: "idle",
      hasNoColumns: false,
    });
    expect(result.current.scopeOptions[0]).toMatchObject({ value: "selection", isDisabled: true });
    expect(result.current.deliveryOptions[1]?.label).toContain("a@example.com");
    act(() => result.current.setChosen([]));
    expect(result.current.hasNoColumns).toBe(true);
    act(() => result.current.setScope("selection"));
    act(() => result.current.setDelivery("email"));
    act(() => result.current.setFormat("xlsx"));
    expect(result.current).toMatchObject({ scope: "selection", delivery: "email", format: "xlsx" });
  });

  it("exports the choice, shows done and closes a moment later", async () => {
    vi.useFakeTimers();
    const onExport = vi.fn(() => Promise.resolve());
    const onOpenChange = vi.fn();
    const onSettled = vi.fn();
    const { result } = renderHook(() =>
      useExportDialogState({
        formats,
        counts: { all: 3 },
        defaultOpen: true,
        onOpenChange,
        onExport,
      }),
    );
    await act(async () => result.current.submit(onSettled));
    expect(onExport).toHaveBeenCalledWith(
      { format: "csv", columns: [], scope: "all", delivery: "download" },
      expect.any(Function),
    );
    expect(onSettled).toHaveBeenCalledWith(true);
    expect(result.current.isDone).toBe(true);
    await act(async () => vi.advanceTimersByTime(1200));
    expect(result.current.open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    act(() => result.current.setOpen(true));
    expect(result.current.phase).toBe("idle");
    vi.useRealTimers();
  });

  it("reports a failed export", async () => {
    const { result } = renderHook(() =>
      useExportDialogState({
        formats,
        counts: {},
        onExport: () => Promise.reject(new Error("offline")),
      }),
    );
    expect(result.current.scope).toBe("all");
    await act(async () => result.current.submit());
    expect(result.current.phase).toBe("failed");
  });
});

describe("useImportDialogState", () => {
  const fields = [{ key: "name", label: "Name", isRequired: true }];
  const preview: ImportPreview = { columns: ["Name"], sample: { Name: "Ada" }, rowCount: 1 };
  const dryRun: ImportDryRun = { created: 1, updated: 0, skipped: 0, failed: 0, issues: [] };

  it("walks read, match, review and import, then starts over when closed", async () => {
    const onRead = vi.fn(() => Promise.resolve(preview));
    const onDryRun = vi.fn(() => Promise.resolve(dryRun));
    const onImport = vi.fn((_mapping: unknown, progress: (fraction: number) => void) => {
      progress(0.5);
      return Promise.resolve(undefined);
    });
    const { result } = renderHook(() =>
      useImportDialogState<{ name: string }>({
        fields,
        onRead,
        onDryRun,
        onImport,
        defaultOpen: true,
      }),
    );
    expect(result.current).toMatchObject({ step: "upload", index: 0, total: 4, open: true });
    act(() => result.current.read([]));
    expect(onRead).not.toHaveBeenCalled();
    await act(async () => result.current.read([{ name: "people.csv" }]));
    expect(result.current.step).toBe("match");
    expect(result.current.file?.name).toBe("people.csv");
    await act(async () => result.current.check());
    expect(result.current.step).toBe("review");
    expect(result.current.dryRun).toBe(dryRun);
    await act(async () => result.current.run());
    expect(result.current.step).toBe("import");
    // The app returned no result, so the dry run stands for it.
    expect(result.current.result).toBe(dryRun);
    expect(result.current.isImporting).toBe(false);
    act(() => result.current.go("review"));
    expect(result.current.step).toBe("review");
    act(() => result.current.setOpen(false));
    expect(result.current).toMatchObject({ step: "upload", open: false, file: undefined });
  });

  it("shows a failure, keeps the step, and lets the import run again", async () => {
    const onImport = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(dryRun);
    const { result } = renderHook(() =>
      useImportDialogState<{ name: string }>({
        fields,
        onRead: () => Promise.reject(new Error("bad file")),
        onDryRun: () => Promise.resolve(dryRun),
        onImport,
      }),
    );
    await act(async () => result.current.read([{ name: "x.csv" }]));
    expect(result.current.step).toBe("upload");
    expect(result.current.failure).toEqual(expect.any(String));
    await act(async () => result.current.run());
    expect(result.current.failure).toEqual(expect.any(String));
    expect(result.current.isImporting).toBe(false);
    await act(async () => result.current.run());
    expect(result.current.result).toBe(dryRun);
    expect(result.current.failure).toBeUndefined();
  });
});

describe("useDesignSystemState", () => {
  const platform = {
    isSystemReduced: false,
    resolveColorScheme: (scheme: string): "light" | "dark" =>
      scheme === "dark" ? "dark" : "light",
  };

  it("keeps its own values, tells the app, and keeps its identity until one changes", () => {
    const onLocaleChange = vi.fn();
    const onColorSchemeChange = vi.fn();
    const { result, rerender } = renderHook(() =>
      useDesignSystemState({ onLocaleChange, onColorSchemeChange }, platform),
    );
    expect(result.current).toMatchObject({
      colorScheme: "system",
      resolvedColorScheme: "light",
      locale: "en",
      direction: "ltr",
      theme: "stackra",
      transition: "circle-origin",
      motion: "full",
      resolvedMotion: "full",
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    act(() => result.current.setLocale("ar"));
    expect(result.current).toMatchObject({ locale: "ar", direction: "rtl" });
    expect(onLocaleChange).toHaveBeenCalledWith("ar");
    act(() => result.current.setColorScheme("dark"));
    expect(result.current.resolvedColorScheme).toBe("dark");
    expect(onColorSchemeChange).toHaveBeenCalledWith("dark");
    act(() => result.current.setBrand("figentra"));
    act(() => result.current.setTransition("fade"));
    act(() => result.current.setMotion("none"));
    expect(result.current).toMatchObject({
      brand: "figentra",
      transition: "fade",
      motion: "none",
      resolvedMotion: "none",
    });
  });

  it("follows controlled values, the given direction and the system's reduced motion", () => {
    const { result } = renderHook(() =>
      useDesignSystemState(
        { locale: "ar", direction: "ltr", colorScheme: "dark", motion: "full" },
        { ...platform, isSystemReduced: true },
      ),
    );
    act(() => result.current.setLocale("en"));
    expect(result.current).toMatchObject({
      locale: "ar",
      direction: "ltr",
      colorScheme: "dark",
      resolvedMotion: "reduced",
    });
  });
});
