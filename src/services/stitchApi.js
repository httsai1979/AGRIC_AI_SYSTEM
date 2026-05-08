/**
 * ANTIGRAVITY STITCH - API Service Layer
 * 深度對齊 SCHEMA.md 數據字典與安全確信協定
 */

const GAS_URL = import.meta.env.VITE_GAS_URL;

/**
 * 生成影像數位指紋 (SHA-256)
 */
const generateIntegrityHash = async (base64) => {
  const msgUint8 = new TextEncoder().encode(base64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const stitchApi = {
  /**
   * 提交確信數據至 GAS 後端
   * 強制對齊 Raw_Inputs 欄位
   */
  submitData: async (captureData, farmerUid = "FARMER_001") => {
    const logId = `LOG-${Date.now()}`;
    const logDate = new Date().toISOString();

    // 數據封裝：對齊 SCHEMA.md 欄位定義
    const payload = {
      log_id: logId,                     // A 欄: 系統流水號
      log_date: logDate,                 // B 欄: 紀錄時間
      farmer_uid: farmerUid,             // C 欄: 農民帳號 ID
      batch_number: "CONTRACT-2024-001", // D 欄: 批號 (暫設)
      operation_item: captureData.operation_item || "施肥", // E 欄: 作業項目
      material_name: captureData.material_name,           // F 欄: 資材名稱
      usage_amount: captureData.usage_amount,             // G 欄: 使用數量
      original_unit: captureData.original_unit || "包",   // H 欄: 原始單位
      receipt_photo_url: captureData.image,               // I 欄: 單據影像 (傳送 Base64 供 GAS 存入 Drive)
      coordinates: captureData.coords,                    // L 欄: 產地經緯度
      integrity_hash: captureData.hash,                   // Q 欄位延伸: 數位指紋防偽
      client_metadata: {
        browser: navigator.userAgent,
        timestamp: logDate
      }
    };

    /**
     * GAS CORS 限制解決方案：
     * 使用 Content-Type: text/plain 並將 JSON 轉為字串
     * 後端 doPost(e) 使用 JSON.parse(e.postData.contents) 解析
     */
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      console.log(`[STITCH] Data Pushed: ${logId}`);
      return { success: true, logId, hash: captureData.hash };
    } catch (err) {
      console.error("[STITCH] Sync Failed:", err);
      throw err;
    }
  }
};
