/**
 * ANTIGRAVITY STITCH - API Service Layer
 * 深度對齊 SCHEMA.md 數據字典與安全確信協定
 */

const GAS_URL = import.meta.env.VITE_GAS_URL;

const FARM_LOCATION = { lat: 23.582, lng: 120.156 }; // 契作農地中心
const HMAC_SECRET = import.meta.env.VITE_LINE_CHANNEL_SECRET || "AGRIC_SECRET";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
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

const signData = async (message) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(HMAC_SECRET),
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
    
    // 地理圍欄驗證 (Geofencing)
    const [cLat, cLon] = (captureData.coords || "0,0").split(',').map(Number);
    const distance = calculateDistance(cLat, cLon, FARM_LOCATION.lat, FARM_LOCATION.lng);
    const risk = distance > 500 ? "LOCATION_MISMATCH" : "NONE";

    // 密碼學簽章
    const signatureStr = `${captureData.hash}|${captureData.coords}|${logDate}`;
    const hmacSignature = await signData(signatureStr);

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
      integrity_hash: captureData.hash,
      hmac_signature: hmacSignature,
      risk_level: risk,
      distance_to_farm: `${distance.toFixed(1)}m`,
      auth_token: await signData(`AUTH|${farmerUid}|${logId}`), // Stateless Auth
      client_metadata: JSON.stringify({
        browser: navigator.userAgent,
        timestamp: logDate
      })
    };

    /**
     * CORS 解決方案：採用 x-www-form-urlencoded 避開 Google Apps Script 攔截
     */
    const formBody = new URLSearchParams();
    Object.keys(payload).forEach(key => formBody.append(key, payload[key]));

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: formBody.toString()
      });


      console.log(`[STITCH] Data Pushed: ${logId}`);
      return { success: true, logId, hash: captureData.hash };
    } catch (err) {
      console.error("[STITCH] Sync Failed:", err);
      throw err;
    }
  }
};
