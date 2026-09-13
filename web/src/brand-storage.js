// Read old browser data once so the product rename preserves existing sessions.
function migrateBrandStorage(storage) {
  try {
    for (const oldKey of Object.keys(storage)) {
      if (!oldKey.startsWith("resistlens")) continue;
      const newKey = "tracerx" + oldKey.slice(10);
      if (storage.getItem(newKey) === null) storage.setItem(newKey, storage.getItem(oldKey));
      storage.removeItem(oldKey);
    }
  } catch { /* Storage may be blocked by browser privacy settings. */ }
}
if (typeof window !== "undefined") {
  try {
    migrateBrandStorage(window.localStorage);
    migrateBrandStorage(window.sessionStorage);
  } catch { /* Access to the storage object itself can also be blocked. */ }
}
