import { useState, useEffect, useRef } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import * as ttapi from "@tomtom-international/web-sdk-services";
import "@tomtom-international/web-sdk-maps/dist/maps.css";

import axios from "axios";

const TT_KEY = "5sbgR8y9A0wzjm65DjckS5GEBLSVVWly";

function App() {
  const mapElement = useRef();
  const [longitude, setLongitude] = useState(-100.843683);
  const [latitude, setLatitude] = useState(40.052235);
  const [zoom, setZoom] = useState(3);
  const [map, setMap] = useState({});

  const convertToPoints = (lngLat) => {
    return {
      point: {
        latitude: lngLat.lat,
        longitude: lngLat.lng,
      },
    };
  };

  const origin = {
    lng: longitude,
    lat: latitude,
  };

  const addDeliveryMarker = (lngLat, map) => {
    const element = document.createElement("div");
    element.className = "marker-delivery";
    const marker = new tt.Marker({
      element: element,
    }).setLngLat([longitude, latitude]);
  };

  const adjustZoom = (z, sym) => {
    if (sym === "plus") {
      const n = z + 1;
      setZoom(n);
    } else {
      const n = z - 1;
      setZoom(n);
    }
  };

  const drawRoute = (geoJson, map) => {
    if (map.getLayer("route")) {
      map.removelayer("route");
      map.removeSource("route");
    }
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geoJson",
        data: geoJson,
      },
      paint: {
        "line-color": "red",
        "line-width": 5,
      },
    });
  };
  useEffect(() => {
    const destinations = [];

    try {
    } catch (err) {}
    let map = tt.map({
      key: TT_KEY,
      container: mapElement.current,
      center: [longitude, latitude],
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true,
      },
      zoom: zoom,
    });
    setMap(map);

    const addMarker = () => {
      const popupOffset = {
        bottom: [0, 25],
      };
      // const popup = new tt.Popup({ offset: popupOffset }).setHTML(
      //   "You Are Here"
      // );
      const element = document.createElement("div");
      element.className = "marker animate-pulse";
      const marker = new tt.Marker({
        draggable: true,
        element: element,
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        setLatitude(lngLat.lat);
        setLongitude(lngLat.lng);
      });

      // marker.setPopup(popup).togglePopup();
    };
    addMarker();

    const sortDestinations = (locations) => {
      const pointsForDestinations = locations.map((el) => {
        return convertToPoints(el);
      });
      const callParameters = {
        key: TT_KEY,
        destinations: pointsForDestinations,
        origins: [convertToPoints(origin)],
      };
      return new Promise((resolve, reject) => {
        ttapi.services
          .matrixRouting(callParameters)
          .then((matrixAPIResults) => {
            matrixAPIResults.matrix[0];
            const resultsArray = destinations.map((result, i) => {
              return {
                location: locations[i],
                // drivingtime:
                //   matrixAPIResults.response.routeSummary.travelTimeInSeconds,
              };
            });
            resultsArray.sort((a, b) => {
              return a.drivingtime - b.drivingtime;
            });
            const sortedResults = resultsArray.map((result) => {
              return result.location;
            });
            resolve(sortedResults);
          });
      });
    };

    const recalculateRoutes = () => {
      console.log(destinations);
      sortDestinations(destinations).then((sorted) => {
        sorted.unshift(origin);
        ttapi.services
          .calculateRoute({
            key: TT_KEY,
            locations: sorted,
          })
          .then((routeData) => {
            const geoJson = routeData.toGeoJson();
            drawRoute(geoJson, map);
          });
      });
    };

    const checkIncidents = () => {
      const incident = new ttapi.services.incidentDetailsV5({
        key: TT_KEY,
        boundingBox: [`${longitude}  ,  ${latitude}`],
      }).then(function (response) {
        console.log(response);
      });
    };

    map.on("click", (e) => {
      destinations.push(e.lngLat);
      addDeliveryMarker();
      // recalculateRoutes();
      // checkIncidents();
    });

    return () => map.remove();
  }, [longitude, latitude, zoom]);

  return (
    <div className="main-container">
      <div className="table-header-row flex flex-row min-w-full mx-auto">
        <div className="data-col">
          <h1 className="mx-auto">3,000,000,000</h1>
        </div>
        <div className="data-col mx-auto">
          <h1 className="mx-auto">3,000,000,000</h1>
        </div>
        <div className="data-col">
          <h1 className="mx-auto">3,000,000,000</h1>
        </div>
      </div>
      {/* MAP */}
      <div ref={mapElement} className="map-screen">
        <div className="zoom-container">
          <button
            className="zoom-buttons"
            onClick={() => adjustZoom(zoom, "plus")}
          >
            Plus
          </button>
          <button
            className="zoom-buttons"
            onClick={() => adjustZoom(zoom, "minus")}
          >
            Minus
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
