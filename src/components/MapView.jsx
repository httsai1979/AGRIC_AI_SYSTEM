import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AggregatorService } from '../services/AggregatorService';
import { ComplianceManager } from './ComplianceManager';

/**
 * MapView – GIS 與 ESG 整合視圖
 *   * 讀取 AggregatorService 回傳的座標資料 (lat, lng, timestamp, farmer_uid)
 *   * 依據預設多邊形 (契作區) 判斷點的顏色：綠色在區內、紅色在區外
 *   * 在 BUYER 模式下顯示 ComplianceManager 供資料審核
 */
const MapViewComponent = ({ mode }) => {
  const [evidence, setEvidence] = useState([]);

  // 取得歷史座標
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AggregatorService.getEvidenceHistory();
        setEvidence(data);
      } catch (e) {
        console.warn('[MapView] 無法取得證據資料', e);
      }
    };
    load();
  }, []);

  // 契作區多邊形 (可自行改為 API 讀取)
  const farmPolygon = useMemo(
    () => [
      [25.0478, 121.517],
      [25.05, 121.519],
      [25.051, 121.515],
      [25.0478, 121.514],
    ],
    []
  );

  // 判斷點是否在多邊形內
  const isInside = (pt) => {
    const poly = L.polygon(farmPolygon);
    return poly.contains(L.latLng(pt.lat, pt.lng));
  };

  const defaultCenter = useMemo(() => {
    if (evidence.length) {
      const { lat, lng } = evidence[evidence.length - 1];
      return [lat, lng];
    }
    return [25.0478, 121.517]; // 台北市中心
  }, [evidence]);

  return (
    <div className="w-full h-[400px] rounded-md overflow-hidden border-2 border-agric-neon">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap 基礎圖層 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 契作區多邊形 */}
        <Polygon
          positions={farmPolygon}
          pathOptions={{ color: '#0066ff', fillOpacity: 0.15 }}
        />
        {/* 證據點 */}
        {evidence.map((pt, idx) => (
          <CircleMarker
            key={idx}
            center={[pt.lat, pt.lng]}
            pathOptions={{
              radius: 8,
              fillColor: isInside(pt) ? '#00ff00' : '#ff0000',
              color: isInside(pt) ? '#00ff00' : '#ff0000',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>農民 UID:</strong> {pt.farmer_uid}<br />
                <strong>時間:</strong> {new Date(pt.timestamp).toLocaleString()}<br />
                {isInside(pt) ? (
                  <span className="text-green-500">✅ 在契作範圍內</span>
                ) : (
                  <span className="text-red-500 font-bold">⚠️ 超出範圍</span>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {/* BUYER 模式下顯示合規管理 */}
      {mode === 'BUYER' && (
        <div className="mt-4">
          <ComplianceManager mode="BUYER" />
        </div>
      )}
    </div>
  );
};

export const MapView = React.memo(MapViewComponent);
