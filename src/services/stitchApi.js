const GAS_URL = "https://script.google.com/macros/s/AKfycbyqqeI7T9qwpV4C9RfNVLoK7Wz4vwCoAuyUwmZ8jSo9jTAySAIC5VCRdoao1iLjwDq9/exec";

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
  submitData: async (imagePayload, userId) => {
    const coords = await getGeolocation();
    const hash = await generateIntegrityHash(imagePayload);
    const payloadId = `AG-${Date.now()}`;

    const payload = {
      payload_id: payloadId,
      user_id: userId,
      image: imagePayload,
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

    return { success: true, payloadId };
  }
};
