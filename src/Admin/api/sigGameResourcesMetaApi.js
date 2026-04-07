// src/admin/api/sigGameResourcesMetaApi.js

import {
  listSigResourceMeta,
  createSigResourceMeta,
  updateSigResourceMeta,
  deleteSigResourceMeta,
} from "../../api/sigGameResourceMeta";

export async function adminListSigGameResourcesMeta(filters = {}) {
  // UI에서 filters로 group/storagePath 등 넘기면 그대로 전달
  return await listSigResourceMeta(filters);
}

export async function adminCreateSigGameResourceMeta(payload) {
  // payload: {
  //  game, boardType, program, group, slotIndex, sigNumber?, sigName?,
  //  storagePath, imageUrl
  // }
  return await createSigResourceMeta(payload);
}

export async function adminUpdateSigGameResourceMeta(id, payload) {
  return await updateSigResourceMeta(id, payload);
}

export async function adminDeleteSigGameResourceMeta(id) {
  return await deleteSigResourceMeta(id);
}