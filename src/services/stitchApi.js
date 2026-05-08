/**
 * ANTIGRAVITY STITCH - API Service Layer (Secured)
 * 實作密碼學數位簽章與地理圍欄驗證 (Geofencing)
 */

const GAS_URL = import.meta.env.VITE_GAS_URL;
const HMAC_SECRET = import.meta.env.VITE_LINE_CHANNEL_SECRET || "AGRIC_SECRET_KEY";

// 契作農地中心點 (範例座標：雲林縣口湖鄉)
const FARM_LOCATION = { lat: 23.5822, lng: 120.1561 };

/**
 * 哈弗辛公式 (Haversine Formula) 計算地理距離 (公尺)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 地球半徑
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * HMAC-SHA256 數位簽章實作 (Web Crypto API)
 */
const generateHMAC = async (message) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(HMAC_SECRET);
  const key = await crypto.subtle.importKey(
    "raw", keyData,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const stitchApi = {
  submitData: async (captureData, farmerUid = "FARMER_001") => {
    const logId = `LOG-${Date.now()}`;
    const logDate = new Date().toISOString();
    
    // 1. 地理圍欄驗證 (Geofencing)
    const [lat, lng] = (captureData.coords || "0,0").split(',').map(Number);
    const distance = calculateDistance(lat, lng, FARM_LOCATION.lat, FARM_LOCATION.lng);
    const isOutRange = distance > 1000; // 超出 1 公里

    // 2. 生成密碼學數位簽章 (Integrity)
    // 簽章對象：{PayloadId + GPS + Timestamp}
    const signatureStr = `${logId}|${captureData.coords}|${logDate}`;
    const hmacSignature = await generateHMAC(signatureStr);

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
      voice_blob: captureData.voice_blob || null,
      coordinates: captureData.coords,
      integrity_hash: captureData.hash,
      blockchain_tx_id: hmacSignature, // 寫入 Q 欄，作為數位證跡
      geofence_risk: isOutRange ? "LOCATION_MISMATCH" : "NONE",
      distance_meters: distance.toFixed(0),
      auth_token: await generateHMAC(`AUTH|${farmerUid}|${logId}`)
    };

    // 彈出地理警告 (若超出範圍)
    if (isOutRange) {
      alert(`⚠️ 警告：目前位置距離產地約 ${(distance/1000).toFixed(1)}km，座標超出契作範圍，請確認是否於產地操作？`);
    }

    const formBody = new URLSearchParams();
    Object.keys(payload).forEach(key => formBody.append(key, payload[key]));

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: formBody.toString()
      });

      return { success: true, logId, signature: hmacSignature };
    } catch (err) {
      console.error("[SECURE_STITCH] Sync error", err);
      throw err;
    }
  }
};
