/**
 * ANTIGRAVITY STITCH - API Service Layer (Security Hardened)
 * 實作密碼學級別的 HMAC-SHA256 數位簽章
 */

const GAS_URL = import.meta.env.VITE_GAS_URL;
const INTEGRITY_SECRET = import.meta.env.VITE_INTEGRITY_SECRET || "AGRIC_STITCH_SECURE_KEY";

/**
 * 使用 Web Crypto API 生成 HMAC-SHA256 簽章
 */
const generateSignature = async (message) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(INTEGRITY_SECRET);
  const key = await crypto.subtle.importKey(
    "raw", keyData,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const stitchApi = {
  /**
   * 提交數據並附加防竄改數位簽章
   */
  submitData: async (captureData, farmerUid = "FARMER_001") => {
    const logId = `LOG-${Date.now()}`;
    const logDate = new Date().toISOString();
    
    // 1. 構建待簽章字串：{PayloadID + GPS + Timestamp + imageHash}
    const signatureMessage = `${logId}|${captureData.coords}|${logDate}|${captureData.hash}`;
    const digitalSignature = await generateSignature(signatureMessage);

    const payload = {
      log_id: logId,
      log_date: logDate,
      farmer_uid: farmerUid,
      batch_number: "CONTRACT-2024-001",
      operation_item: captureData.operation_item || "施肥",
      material_name: captureData.material_name,
      usage_amount: captureData.usage_amount,
      original_unit: captureData.original_unit || "包",
      image: captureData.image,
      coordinates: captureData.coords,
      integrity_hash: captureData.hash, // 影像指紋
      blockchain_tx_id: digitalSignature, // 直接對齊 SCHEMA.md 的 Q 欄
      client_metadata: JSON.stringify({
        browser: navigator.userAgent,
        timestamp: logDate
      })
    };

    const formBody = new URLSearchParams();
    Object.keys(payload).forEach(key => formBody.append(key, payload[key]));

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: formBody.toString()
      });

      return { success: true, logId, signature: digitalSignature };
    } catch (err) {
      console.error("[SECURE_STITCH] Integrity submission failed", err);
      throw err;
    }
  },

  /**
   * 簽章校驗邏輯 (用於隊列上傳前二次檢查)
   */
  verifyIntegrity: async (task) => {
    const { log_id, coordinates, log_date, integrity_hash, digital_signature } = task;
    const expectedMessage = `${log_id}|${coordinates}|${log_date}|${integrity_hash}`;
    const expectedSignature = await generateSignature(expectedMessage);
    return expectedSignature === digital_signature;
  }
};
