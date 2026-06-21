import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom marker icon using our Tailwind classes and Iconify
const createCustomIcon = (type) => {
  let icon = "ph:map-pin-fill";
  let color = "bg-leaf";
  if (type === 'charging_station') { icon = "ph:lightning-fill"; color = "bg-ochre"; }
  if (type === 'recycling') { icon = "ph:recycle-fill"; color = "bg-terracotta"; }
  if (type === 'park') { icon = "ph:tree-fill"; color = "bg-forest"; }
  if (type === 'thrift_store') { icon = "ph:t-shirt-fill"; color = "bg-[#DDA15E]"; }
  if (type === 'user') { icon = "ph:navigation-arrow-fill"; color = "bg-cream"; }

  return L.divIcon({
    html: `<div class="w-8 h-8 ${color} rounded-full flex items-center justify-center border-2 border-forest shadow-brutal-sm"><iconify-icon icon="${icon}" class="text-forest text-lg"></iconify-icon></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

// Component to dynamically update map center when location changes
function MapUpdater({ center, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom);
  }, [center, map, zoom]);
  return null;
}

export default function GreenMap() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [greenSpots, setGreenSpots] = useState([]);
  const [radius, setRadius] = useState(10000); // in meters
  const [filterType, setFilterType] = useState('all');
  const [visibleCount, setVisibleCount] = useState(4);
  
  // Refs for scrolling to cards
  const cardRefs = useRef({});

  const fetchNearbyGreenSpots = async (lat, lng, searchRadius) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const query = `
        [out:json];
        (
          node["amenity"="recycling"](around:${searchRadius},${lat},${lng});
          node["amenity"="charging_station"](around:${searchRadius},${lat},${lng});
          node["leisure"="park"](around:${searchRadius},${lat},${lng});
          node["shop"="second_hand"](around:${searchRadius},${lat},${lng});
          node["shop"="clothes"](around:${searchRadius},${lat},${lng});
        );
        out body 30;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch data from OpenStreetMap.");
      }
      
      const data = await response.json();
      
      let spots = data.elements.filter(el => el.lat && el.lon).map(el => {
        let type = el.tags.amenity || el.tags.leisure || el.tags.shop;
        if (type === 'second_hand' || type === 'clothes') type = 'thrift_store';
        
        const name = el.tags.name || (
          type === 'charging_station' ? 'EV Charging Station' : 
          type === 'recycling' ? 'Recycling Center' : 
          type === 'thrift_store' ? 'Thrift Store' : 'Local Park'
        );
        const distance = calculateDistance(lat, lng, el.lat, el.lon);
        
        return {
          id: el.id,
          lat: el.lat,
          lng: el.lon,
          name,
          type,
          distance
        };
      });
      
      // Sort by distance
      spots.sort((a, b) => a.distance - b.distance);
      
      setGreenSpots(spots);
      setVisibleCount(4); // Reset pagination
    } catch (e) {
      console.error("Overpass API error:", e);
      setErrorMsg("Failed to load map data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when radius changes if we already have location
  useEffect(() => {
    if (location) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchNearbyGreenSpots(location.lat, location.lng, radius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  const locateUser = () => {
    setLoading(true);
    setErrorMsg(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          fetchNearbyGreenSpots(lat, lng, radius);
        },
        (error) => {
          console.error("Error getting location", error);
          setLoading(false);
          let message = "Could not get your location. Please check browser permissions.";
          if (error.code === 1) message = "Location permission denied. Please enable it in your browser.";
          if (error.code === 2) message = "Location unavailable. Please try again.";
          if (error.code === 3) message = "Location request timed out. Please try again.";
          setErrorMsg(message);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  const handleMarkerClick = (id) => {
    if (cardRefs.current[id]) {
      cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight class
      cardRefs.current[id].classList.add('bg-leaf/20');
      setTimeout(() => {
        if (cardRefs.current[id]) cardRefs.current[id].classList.remove('bg-leaf/20');
      }, 1000);
    }
  };

  // Filter spots
  const filteredSpots = greenSpots.filter(spot => filterType === 'all' || spot.type === filterType);
  const displayedSpots = filteredSpots.slice(0, visibleCount);

  // Determine ideal zoom based on radius
  const getZoomLevel = () => {
    if (radius === 5000) return 13;
    if (radius === 10000) return 12;
    if (radius === 25000) return 11;
    return 13;
  };

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-serif text-4xl font-bold text-forest mb-2">Green Map</h2>
      <p className="text-soil font-medium mb-8">Discover real eco-friendly spots near your actual location using OpenStreetMap.</p>
      
      {errorMsg && (
        <div className="bg-terracotta/10 border-2 border-terracotta p-4 rounded-xl mb-6 flex items-start gap-3">
          <iconify-icon icon="ph:warning-circle-fill" class="text-terracotta text-2xl shrink-0 mt-0.5"></iconify-icon>
          <div className="text-terracotta font-medium">{errorMsg}</div>
        </div>
      )}

      {!location ? (
        <div className="bg-cream border-4 border-forest shadow-brutal p-12 organic-card text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 chat-texture-bg opacity-30 pointer-events-none"></div>
          <div className="relative z-10 w-20 h-20 bg-leaf rounded-full flex items-center justify-center border-4 border-forest shadow-brutal-sm mb-6 animate-bounce-spring">
            <iconify-icon icon="ph:map-pin-fill" class="text-4xl text-cream"></iconify-icon>
          </div>
          <h3 className="relative z-10 font-serif text-3xl font-bold text-forest mb-4">Find Green Spots Nearby</h3>
          <p className="relative z-10 text-soil font-medium mb-8 max-w-md mx-auto">
            We need your location to find real, local recycling centers, EV charging stations, and eco-friendly parks.
          </p>
          <button aria-label="Use My Current Location" className="relative z-10 bg-terracotta border-4 border-forest text-cream font-bold text-lg py-3 px-8 rounded-full hover:bg-forest hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 smooth-transition shadow-brutal-sm uppercase tracking-widest flex items-center gap-3" onClick={locateUser} disabled={loading}>
            <iconify-icon icon={loading ? "ph:spinner-gap-bold" : "ph:navigation-arrow-fill"} class={`text-xl ${loading ? 'animate-spin' : ''}`}></iconify-icon>
            {loading ? 'Locating...' : 'Use My Current Location'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-cream border-4 border-forest shadow-brutal-sm p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Location Display */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-leaf rounded-full flex items-center justify-center border-2 border-forest shrink-0">
                <iconify-icon icon="ph:navigation-arrow-fill" class="text-xl text-cream"></iconify-icon>
              </div>
              <div>
                <p className="text-forest font-bold text-xs uppercase tracking-widest">Current Location</p>
                <p className="font-serif font-bold text-xl text-forest">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
            </div>

            {/* Radius Control */}
            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <span className="text-forest font-bold text-xs uppercase tracking-widest shrink-0">Radius:</span>
              <div className="flex bg-white border-2 border-forest rounded-full overflow-hidden flex-1 md:flex-none shadow-sm">
                {[5000, 10000, 25000].map(r => (
                  <button 
                    key={r}
                    onClick={() => setRadius(r)}
                    disabled={loading}
                    className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold uppercase smooth-transition ${radius === r ? 'bg-forest text-cream' : 'text-forest hover:bg-leaf/20'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {r / 1000}km
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
             <button 
               onClick={() => { setFilterType('all'); setVisibleCount(4); }}
               className={`px-5 py-2 rounded-full border-2 border-forest font-bold text-sm uppercase tracking-wider smooth-transition shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 ${filterType === 'all' ? 'bg-forest text-cream' : 'bg-white text-forest hover:bg-cream'}`}
             >
               All Spots
             </button>
             <button 
               onClick={() => { setFilterType('park'); setVisibleCount(4); }}
               className={`px-5 py-2 rounded-full border-2 border-forest font-bold text-sm uppercase tracking-wider smooth-transition shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${filterType === 'park' ? 'bg-forest text-cream' : 'bg-white text-forest hover:bg-cream'}`}
             >
               <iconify-icon icon="ph:tree-fill"></iconify-icon> Parks
             </button>
             <button 
               onClick={() => { setFilterType('recycling'); setVisibleCount(4); }}
               className={`px-5 py-2 rounded-full border-2 border-forest font-bold text-sm uppercase tracking-wider smooth-transition shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${filterType === 'recycling' ? 'bg-terracotta text-cream' : 'bg-white text-forest hover:bg-cream'}`}
             >
               <iconify-icon icon="ph:recycle-fill"></iconify-icon> Recycling
             </button>
             <button 
               onClick={() => { setFilterType('charging_station'); setVisibleCount(4); }}
               className={`px-5 py-2 rounded-full border-2 border-forest font-bold text-sm uppercase tracking-wider smooth-transition shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${filterType === 'charging_station' ? 'bg-ochre text-forest' : 'bg-white text-forest hover:bg-cream'}`}
             >
               <iconify-icon icon="ph:lightning-fill"></iconify-icon> EV Chargers
             </button>
             <button 
               onClick={() => { setFilterType('thrift_store'); setVisibleCount(4); }}
               className={`px-5 py-2 rounded-full border-2 border-forest font-bold text-sm uppercase tracking-wider smooth-transition shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${filterType === 'thrift_store' ? 'bg-[#DDA15E] text-cream' : 'bg-white text-forest hover:bg-cream'}`}
             >
               <iconify-icon icon="ph:t-shirt-fill"></iconify-icon> Thrift Stores
             </button>
          </div>
          
          <div
            role="application"
            aria-label="Interactive green spots map. Use zoom controls and click markers to view location details. A list of results is also available below."
            className="border-4 border-forest h-[450px] rounded-[2rem] overflow-hidden relative shadow-brutal-sm z-0 group"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[400] flex flex-col items-center justify-center">
                <iconify-icon icon="ph:spinner-gap-bold" class="text-5xl text-forest animate-spin mb-4"></iconify-icon>
                <div className="font-bold text-forest uppercase tracking-widest">Scanning Area...</div>
              </div>
            )}
            <MapContainer 
              center={[location.lat, location.lng]} 
              zoom={getZoomLevel()} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >

              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <MapUpdater center={[location.lat, location.lng]} zoom={getZoomLevel()} />
              
              {/* User Location */}
              <Marker position={[location.lat, location.lng]} icon={createCustomIcon('user')}>
                <Popup>
                  <div className="font-bold text-forest text-center">You are here!</div>
                </Popup>
              </Marker>

              {/* Real Spots */}
              {!loading && filteredSpots.map(spot => (
                <Marker 
                  key={spot.id} 
                  position={[spot.lat, spot.lng]} 
                  icon={createCustomIcon(spot.type)}
                  eventHandlers={{
                    click: () => handleMarkerClick(spot.id),
                  }}
                >
                  <Popup>
                    <div className="font-bold text-forest text-base leading-tight mb-1">{spot.name}</div>
                    <div className="text-xs text-soil uppercase font-bold mb-2">{spot.type.replace('_', ' ')} • {spot.distance.toFixed(1)} km</div>
                    <a 
                      href={`https://maps.google.com/?q=${spot.lat},${spot.lng}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-forest text-cream text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 rounded-lg hover:bg-leaf transition-colors"
                    >
                      Get Directions
                    </a>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          
          {/* Results List */}
          <div className="mt-8">
            <h3 className="font-serif text-2xl font-bold text-forest mb-4">
              {filteredSpots.length} {filterType === 'all' ? 'Spots' : filterType.replace('_', ' ')} Found
            </h3>
            
            {filteredSpots.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedSpots.map(spot => (
                    <div 
                      key={spot.id} 
                      ref={(el) => cardRefs.current[spot.id] = el}
                      className="bg-white border-4 border-forest shadow-brutal p-6 rounded-2xl hover:-translate-y-1 hover:shadow-brutal-hover transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-forest shrink-0 shadow-sm ${spot.type === 'charging_station' ? 'bg-ochre' : spot.type === 'recycling' ? 'bg-terracotta' : spot.type === 'thrift_store' ? 'bg-[#DDA15E]' : 'bg-forest'}`}>
                          <iconify-icon icon={spot.type === 'charging_station' ? 'ph:lightning-fill' : spot.type === 'recycling' ? 'ph:recycle-fill' : spot.type === 'thrift_store' ? 'ph:t-shirt-fill' : 'ph:tree-fill'} class="text-2xl text-cream"></iconify-icon>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-forest leading-tight mb-1">{spot.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-soil font-bold text-[10px] uppercase tracking-wider">{spot.type.replace('_', ' ')}</span>
                            <span className="text-forest/30">•</span>
                            <span className="text-forest font-bold text-[10px] uppercase tracking-wider bg-leaf/20 px-2 py-0.5 rounded-md">{spot.distance.toFixed(1)} km away</span>
                          </div>
                        </div>
                      </div>
                      <a 
                        href={`https://maps.google.com/?q=${spot.lat},${spot.lng}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full text-center bg-cream border-2 border-forest text-forest font-bold text-sm py-2 rounded-xl hover:bg-forest hover:text-cream transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        Get Directions <iconify-icon icon="ph:arrow-right-bold"></iconify-icon>
                      </a>
                    </div>
                  ))}
                </div>
                
                {visibleCount < filteredSpots.length && (
                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="bg-transparent border-2 border-forest text-forest font-bold uppercase tracking-widest py-3 px-8 rounded-full hover:bg-forest hover:text-cream transition-colors"
                    >
                      Show More Spots ({filteredSpots.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : !loading && (
              <div className="text-center p-12 bg-white border-2 border-dashed border-forest rounded-2xl shadow-sm">
                <iconify-icon icon="ph:magnifying-glass-duotone" class="text-5xl text-leaf mb-4"></iconify-icon>
                <h4 className="font-serif text-xl font-bold text-forest mb-2">No spots found</h4>
                <p className="text-soil font-medium">We couldn't find any {filterType !== 'all' ? filterType.replace('_', ' ') : 'green'} spots within a {radius/1000}km radius.<br/>Try expanding your search radius!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
