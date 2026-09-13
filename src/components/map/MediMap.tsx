import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Pharmacy, PharmacyContribution } from '../../types';
import { PATIENT_DEFAULT_LOCATION } from '../../data/demoPharmacies';

interface MediMapProps {
  pharmacies: Pharmacy[];
  selectedContributions: PharmacyContribution[];
  patientLocation?: { lat: number; lng: number; address: string };
  className?: string;
}

export const MediMap: React.FC<MediMapProps> = ({
  pharmacies,
  selectedContributions,
  patientLocation = PATIENT_DEFAULT_LOCATION,
  className = "h-80 w-full",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const selectedIds = new Set(selectedContributions.map(c => c.pharmacy.id));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [patientLocation.lat, patientLocation.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // High quality OpenStreetMap tiles with subtle styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Patient Marker (Blue Pulsing Icon)
    const patientIcon = L.divIcon({
      className: 'custom-patient-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(21, 101, 192, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 26px; height: 26px; background: #1565C0; border: 3px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
            <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([patientLocation.lat, patientLocation.lng], { icon: patientIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <b style="color: #1565C0; font-size: 14px;">Your Location (Patient)</b>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">${patientLocation.address}</p>
        </div>
      `);

    const bounds = L.latLngBounds([[patientLocation.lat, patientLocation.lng]]);

    // Render Pharmacy Markers
    pharmacies.forEach(pharm => {
      const isSelected = selectedIds.has(pharm.id);
      const contribution = selectedContributions.find(c => c.pharmacy.id === pharm.id);

      bounds.extend([pharm.lat, pharm.lng]);

      const markerColor = isSelected ? '#2E7D32' : '#94A3B8';
      const bgColor = isSelected ? '#E8F5E9' : '#F1F5F9';
      const zIndex = isSelected ? 1000 : 100;

      const pharmacyIcon = L.divIcon({
        className: 'custom-pharmacy-marker',
        html: `
          <div style="position: relative; z-index: ${zIndex};">
            <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; border: 2px solid ${markerColor}; padding: 4px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); white-space: nowrap;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${markerColor};"></span>
              <span style="font-size: 11px; font-weight: 700; color: #1E293B;">${pharm.name.replace('Pharmacy', '').trim()}</span>
              ${isSelected ? `<span style="background: #2E7D32; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 999px;">ETA ${pharm.totalEtaMin}m</span>` : ''}
            </div>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15],
      });

      const popupHtml = `
        <div style="font-family: system-ui; min-width: 180px; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px; color: ${isSelected ? '#2E7D32' : '#334155'};">
            ${pharm.name} ${isSelected ? '✓ (DISPATCHED)' : ''}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
            ${pharm.distanceKm} km away • ~${pharm.totalEtaMin} min ETA
          </div>
          ${isSelected && contribution ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 11px;">
              <b style="color: #0F172A;">Supplying (${contribution.medicinesCovered.length} items):</b>
              <ul style="margin: 4px 0 0 16px; padding: 0; color: #15803D;">
                ${contribution.medicinesCovered.map(m => `<li>${m.name} (Qty: ${m.quantity})</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;

      L.marker([pharm.lat, pharm.lng], { icon: pharmacyIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      // Draw connection lines to selected dispatch hubs
      if (isSelected) {
        L.polyline(
          [
            [patientLocation.lat, patientLocation.lng],
            [pharm.lat, pharm.lng],
          ],
          {
            color: '#2E7D32',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.85,
          }
        ).addTo(map);
      }
    });

    // Fit bounds with comfortable padding
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [pharmacies, selectedContributions, patientLocation]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 shadow-inner bg-slate-100 ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
        <span>Parallel Dispatch Active</span>
      </div>
    </div>
  );
};
