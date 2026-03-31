// src/api/storageResources.js

import { storage } from "../core/firebase";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

// 카테고리 타입은 일단 문자열로 두고, 나중에 TS 쓰면 union 타입으로 바꿔도 됨
export async function listResources(category) {
  const folderRef = ref(storage, `images/${category}`);
  const result = await listAll(folderRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        fileName: itemRef.name, // 예: "sig_001.png"
        url,
      };
    })
  );

  return items;
}

export async function uploadResource(category, file) {
  const fileRef = ref(storage, `images/${category}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { fileName: file.name, url };
}

export async function deleteResource(category, fileName) {
  const fileRef = ref(storage, `images/${category}/${fileName}`);
  await deleteObject(fileRef);
}