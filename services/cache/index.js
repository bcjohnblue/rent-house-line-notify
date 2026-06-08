import { Storage } from '@google-cloud/storage';

const useGCS = !!process.env.GCS_BUCKET_NAME;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const CACHE_FILE = 'cache.json';

// ─── 本地 No-Cache（GCS_BUCKET_NAME 未設定時使用）──────────────────────────
// has 回 true + get 回 [] → 所有物件都被視為「未推過」，每次推全部
const noCache = {
  has: () => true,
  get: () => [],
  set: async () => {},
};

// ─── GCS Cache（GCS_BUCKET_NAME 已設定時使用）────────────────────────────────
let storage = null;
let gcsData = null;

const getStorage = () => {
  if (!storage) storage = new Storage();
  return storage;
};

const loadGCS = async () => {
  if (gcsData) return;
  try {
    const file = getStorage().bucket(BUCKET_NAME).file(CACHE_FILE);
    const [exists] = await file.exists();
    const raw = exists ? JSON.parse((await file.download())[0].toString()) : {};
    // 確保所有 value 都是陣列（舊格式或意外資料一律歸零）
    gcsData = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v : []]),
    );
  } catch (error) {
    console.error('loadGCS error', error.message);
    gcsData = {};
  }
};

const saveGCS = async () => {
  try {
    await getStorage().bucket(BUCKET_NAME).file(CACHE_FILE).save(
      JSON.stringify(gcsData),
      { contentType: 'application/json' },
    );
  } catch (error) {
    console.error('saveGCS error', error.message);
  }
};

const gcsCache = {
  has: (key) => gcsData !== null && key in gcsData,
  get: (key) => gcsData?.[key],
  set: async (key, value) => {
    gcsData[key] = value;
    await saveGCS();
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const start = async () => {
  if (useGCS) {
    await loadGCS();
    console.log('📦 Cache: GCS');
  } else {
    console.log('📦 Cache: No Cache（本地開發模式，每次推播全部物件）');
  }
};

export const instance = () => (useGCS ? gcsCache : noCache);

export default { start, instance };
