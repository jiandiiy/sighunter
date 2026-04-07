// src/admin/hooks/useAdminResourceUpload.js

import { useState } from "react";
import { normalizeGroup01 } from "../../resources/config/groupNormalization";
import {
  uploadProgramGroupImage,
  deleteProgramImage,
} from "../../resources/storage/sigResourceStorage";

import {
  createSigResourceMeta,
  getSigGameResourceMetaById,
  deleteSigResourceMetaById,
} from "../../resources/firestore/sigGameResourcesMeta";

export default function useAdminResourceUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function uploadResource({
    file,
    mode, // program
    group,
    game,
    boardType,
    slotIndex,
    sigNumber,
    sigName,
    storageKind = "images", // 현재 코드베이스는 이미지 업로드만 쓰는 것 같아 기본값 둠
    // resourceId는 "Firestore 문서 ID"인데, 지금 페이지 로직은 createSigResourceMeta(payload)로 생성하므로 생략 가능
  }) {
    setUploading(true);
    setError(null);

    try {
      // 1) group 정규화: 어드민에서는 반드시 group01로 통일
      const normalizedGroup = normalizeGroup01(group);

      // 2) Storage 업로드
      // sigResourceStorage.js는 내부에서 images/{program}/{group}/{file.name}로 업로드함
      const uploaded = await uploadProgramGroupImage(mode, normalizedGroup, file);
      // uploaded: { fileName, fullPath, url }

      // 3) Firestore 메타 생성
      // 지안 페이지의 payload 필드와 동일하게 맞춤
      const payload = {
        game,
        boardType: boardType || null,
        program: mode,
        group: normalizedGroup,
        slotIndex: Number(slotIndex),
        sigNumber: sigNumber !== "" && sigNumber !== null ? Number(sigNumber) : null,
        sigName: sigName || "",
        storagePath: uploaded.fullPath,
        imageUrl: uploaded.url,
      };

      // createSigResourceMeta가 id를 리턴하는지 페이지에서 사용 중이라 동작 맞춰둠
      const id = await createSigResourceMeta(payload);

      return {
        id,
        uploaded,
        payload,
      };
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  /**
   * "이미지 삭제" + "연결된 메타 삭제"를 완전히 하려면
   * 메타가 여러 개면 목록 조회 후 batch로 지우는 로직이 필요해.
   * 여기서는 hook 이름상 최소 단일 메타 기준 삭제(메타 1개 삭제)만 제공.
   */
  async function removeResource({ metaId }) {
    setUploading(true);
    setError(null);

    try {
      // 1) 메타 확인
      const meta = await getSigGameResourceMetaById(metaId);
      if (!meta?.storagePath) throw new Error("storagePath not found in meta");

      // 2) Storage 삭제
      await deleteProgramImage(meta.storagePath);

      // 3) Firestore 메타 삭제
      await deleteSigResourceMetaById(metaId);

      return true;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setUploading(false);
    }
  }

  return {
    uploading,
    error,
    uploadResource,
    removeResource,
  };
}