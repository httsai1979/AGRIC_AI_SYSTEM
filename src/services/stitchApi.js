const GAS_URL = import.meta.env.VITE_GAS_URL;

const generateIntegrityHash = async (base64) => {
  const msgUint8 = new TextEncoder().encode(base64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getGeolocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) resolve({ lat: 0, lng: 0 });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ 
        lat: parseFloat(pos.coords.latitude.toFixed(6)), 
        lng: parseFloat(pos.coords.longitude.toFixed(6)) 
      }),
      () => resolve({ lat: 0, lng: 0 })
    );
  });
};

export const stitchApi = {
  submitData: async (imagePayload, farmerUid) => {
    const coords = await getGeolocation();
    const hash = await generateIntegrityHash(imagePayload);
    const logId = `LOG-${Date.now()}`;
    const logDate = new Date().toISOString();

    const payload = {
      log_id: logId,              // Aligned with SCHEMA.md
      log_date: logDate,          // Aligned with SCHEMA.md
      farmer_uid: farmerUid,      // Aligned with SCHEMA.md
      batch_number: "PENDING",    // Default value for Raw_Inputs
      image: imagePayload,
      coordinates: `${coords.lat}, ${coords.lng}`, // Aligned with SCHEMA.md column L
      client_metadata: {
        browser: navigator.userAgent,
        geolocation: coords
      },
      integrity_hash: hash
    };

    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return { success: true, logId };
  }
};

