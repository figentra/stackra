/**
 * Stackra file contract:
 * Purpose: proves `pickerFor` gives no picker, without requiring the package, when the app binary lacks the Expo
 *          native module (a dev client built before the picker was added).
 * Boundary: test only; no native runtime.
 * Runtime: node (vitest)
 * Governing contract: design-system gap inventory (file trigger); ADR 0022 (test placement).
 */
import { createRequire } from "node:module";

import { pickerFor } from "#native/file-trigger/picker-for.function";

describe("pickerFor (native)", () => {
  it.each(["files", "photos", "camera"] as const)(
    "gives no %s picker without its native module",
    (source) => {
      expect(pickerFor(source)).toBeNull();
    },
  );
});

describe("pickerFor (native) with its modules", () => {
  const documents = { getDocumentAsync: vi.fn() };
  const images = {
    requestCameraPermissionsAsync: vi.fn(),
    launchCameraAsync: vi.fn(),
    launchImageLibraryAsync: vi.fn(),
  };
  const scope = globalThis as { expo?: unknown };
  // The module loads its optional peers with `require`, which vi.mock does not reach, so the stand-ins go in the
  // require cache under the peers' resolved paths.
  const load = createRequire(import.meta.url);
  const paths = [load.resolve("expo-document-picker"), load.resolve("expo-image-picker")] as const;
  const cache = (path: string, exports: unknown) => {
    load.cache[path] = { id: path, filename: path, loaded: true, exports } as NodeJS.Module;
  };

  beforeEach(() => {
    scope.expo = { modules: { ExpoDocumentPicker: {}, ExponentImagePicker: {} } };
    cache(paths[0], documents);
    cache(paths[1], images);
  });
  afterEach(() => {
    delete scope.expo;
    for (const path of paths) Reflect.deleteProperty(load.cache, path);
    vi.resetAllMocks();
  });

  it("picks documents of the given types and maps them to picked files", async () => {
    documents.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a.pdf", name: "a.pdf", size: 3, mimeType: "application/pdf" }],
    });
    const pick = pickerFor("files");
    await expect(pick?.({ types: ["application/pdf"], multiple: true })).resolves.toEqual([
      { uri: "file:///a.pdf", name: "a.pdf", size: 3, type: "application/pdf" },
    ]);
    expect(documents.getDocumentAsync).toHaveBeenCalledWith({
      type: ["application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });
  });

  it("asks for any document without types and gives nothing when cancelled", async () => {
    documents.getDocumentAsync.mockResolvedValueOnce({ canceled: true });
    documents.getDocumentAsync.mockResolvedValueOnce({ canceled: false, assets: null });
    const pick = pickerFor("files");
    await expect(pick?.({ multiple: false })).resolves.toEqual([]);
    expect(documents.getDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ type: "*/*" }),
    );
    await expect(pick?.({ types: [], multiple: false })).resolves.toEqual([]);
  });

  it("picks several photos, naming each by its file name or the end of its uri", async () => {
    images.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: "file:///x/one.jpg", fileName: "One.jpg", fileSize: 9, mimeType: "image/jpeg" },
        { uri: "file:///x/two.png", fileName: null },
      ],
    });
    const files = await pickerFor("photos")?.({ multiple: true });
    expect(files).toEqual([
      { uri: "file:///x/one.jpg", name: "One.jpg", size: 9, type: "image/jpeg" },
      { uri: "file:///x/two.png", name: "two.png", size: undefined, type: undefined },
    ]);
    expect(images.launchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
    });
    expect(images.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it("takes one camera photo once allowed, and nothing when refused or cancelled", async () => {
    images.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });
    const pick = pickerFor("camera");
    await expect(pick?.({ multiple: true })).resolves.toEqual([]);
    expect(images.launchCameraAsync).not.toHaveBeenCalled();
    images.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    images.launchCameraAsync.mockResolvedValueOnce({ canceled: true });
    await expect(pick?.({ multiple: true })).resolves.toEqual([]);
    expect(images.launchCameraAsync).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
    });
    images.launchCameraAsync.mockResolvedValueOnce({ canceled: false });
    await expect(pick?.({ multiple: false })).resolves.toEqual([]);
  });

  it("gives no picker when the package cannot be loaded", () => {
    const failing = {} as NodeJS.Module;
    Object.defineProperty(failing, "exports", {
      get: () => {
        throw new Error("missing");
      },
    });
    for (const path of paths) load.cache[path] = failing;
    expect(pickerFor("files")).toBeNull();
    expect(pickerFor("photos")).toBeNull();
  });
});
