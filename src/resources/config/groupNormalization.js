// src/resources/config/groupNormalization.js

export function normalizeGroup01(group) {
  if (group === undefined || group === null) return "group01";

  const s = String(group).trim().toLowerCase();

  // group01 ~ group12
  if (/^group\d{2}$/.test(s)) return s;

  // group1 ~ group12 -> group01 ~ group12
  const m = s.match(/^group(\d{1,2})$/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 12) {
      return `group${String(n).padStart(2, "0")}`;
    }
  }

  // fallback
  return "group01";
}

/**
 * Firestore에 저장된 storagePath/URL에 group1%2F 처럼 인코딩이 섞인 케이스를 보정.
 */
export function normalizeEncodedGroupPart(input) {
  if (!input) return input;
  const s = String(input);

  // group1%2F -> group01%2F
  let out = s.replace(/group1(%2F)/gi, "group01$1");

  // /group1/ -> /group01/
  out = out.replace(/\/group1\//gi, "/group01/");

  return out;
}

/**
 * storagePath 비교용: 경로 안의 group 표현까지 같이 정규화해서 문자열 비교 실패를 방지.
 */
export function normalizeStoragePathForCompare(path) {
  if (!path) return path;
  const decoded = normalizeEncodedGroupPart(path);
  // 여기서는 normalizeEncodedGroupPart만으로도 대부분 해결됨(필요시 추가 규칙 확장 가능)
  return decoded;
}