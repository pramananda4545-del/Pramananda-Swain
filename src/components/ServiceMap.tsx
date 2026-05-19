import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { ProviderProfile } from '../lib/types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function ServiceMap({ 
  providers, 
  onSelectProvider,
  center = { lat: 37.42, lng: -122.08 },
  zoom = 12
}: { 
  providers: ProviderProfile[], 
  onSelectProvider?: (p: ProviderProfile) => void,
  center?: { lat: number, lng: number },
  zoom?: number
}) {
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-neutral-100 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold mb-4">Google Maps Key Required</h3>
        <p className="text-neutral-600 mb-6 max-w-md"> Please follow the instructions in AI Studio to add your GOOGLE_MAPS_PLATFORM_KEY secret.</p>
        <div className="text-left text-xs bg-white p-4 rounded border border-neutral-200">
           1. Settings → Secrets <br/>
           2. Name: GOOGLE_MAPS_PLATFORM_KEY <br/>
           3. Value: Your GMP API Key
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-neutral-200">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
          disableDefaultUI={true}
        >
          {providers.map((p) => (
            <AdvancedMarker 
              key={p.userId} 
              position={p.location} 
              onClick={() => onSelectProvider?.(p)}
            >
              <Pin background={p.category === 'doctor' ? '#ef4444' : '#3b82f6'} glyphColor="#fff" scale={1.2} />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
