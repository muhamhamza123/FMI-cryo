// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing map...');
    initMap();
});

function initMap() {
    // Fix for Leaflet marker icons
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    console.log('Leaflet icon configuration set');
    loadMapAndData();
}

function loadMapAndData() {
    const map = L.map('map').setView([66.5, 26.0], 6); // Centered on Finland

    const lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');

    let currentLayer = lightLayer;
    let allData = [];
    let allMarkers = [];

    console.log('Map initialized');

    // Add loading indicator
    console.log('Map script loaded successfully');

    fetch('/locations')
        .then(r => {
            console.log('Fetch response status:', r.status);
            if (!r.ok) {
                throw new Error(`HTTP error! status: ${r.status}`);
            }
            return r.json();
        })
        .then(data => {
            console.log('Locations data received:', data.length, 'items');
            allData = data;
            populateFilters(data);
            renderMarkers(data, map, allMarkers);
            document.getElementById("no-results-panel").classList.add('hidden');
        })
        .catch(error => {
            console.error('Error loading locations:', error);
            const panel = document.getElementById("no-results-panel");
            panel.textContent = `⚠️ Error loading data: ${error.message}`;
            panel.classList.remove('hidden');
        });

    // Event listeners
    document.getElementById("theme-toggle").addEventListener("click", function() {
        toggleTheme(map, currentLayer, lightLayer, darkLayer);
    });
    document.getElementById("apply-filters").addEventListener("click", function() {
        applyFilters(allData, map, allMarkers);
    });
    document.getElementById("reset-filters").addEventListener("click", function() {
        resetFilters(allData, map, allMarkers);
    });
    document.getElementById("toggle-filters").addEventListener("click", toggleFilters);

    // Store references for later use
    window.mapData = { map, allData, allMarkers, currentLayer, lightLayer, darkLayer };
}

function populateFilters(data) {
    const varSelect = document.getElementById("variableFilter");
    const typeSelect = document.getElementById("typeFilter");

    [...new Set(data.map(d => d.Measured_variable).filter(Boolean))]
        .forEach(v => varSelect.add(new Option(v, v)));

    [...new Set(data.map(d => d.Measurement_type).filter(Boolean))]
        .forEach(t => typeSelect.add(new Option(t, t)));
}

function renderMarkers(data, map, allMarkers) {
    // Clear existing markers
    allMarkers.forEach(m => map.removeLayer(m));
    allMarkers.length = 0;

    let skippedCount = 0;

    data.forEach((loc, index) => {
        // Convert latitude and longitude to numbers
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);

        // Check if coordinates are valid
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            skippedCount++;
            console.log(`Skipping location ${index} (invalid coords):`, loc.name, 'lat:', loc.latitude, 'lng:', loc.longitude);
            return;
        }

        console.log(`Adding marker ${allMarkers.length + 1}:`, loc.name, 'at', lat, lng);

        const link = loc.url && loc.url.trim()
            ? `<a href="${loc.url}" target="_blank">Dataset link</a>`
            : `<i>Dataset link not available</i>`;

        const marker = L.marker([lat, lng])
            .bindPopup(`
                <b>${loc.name || "Unnamed dataset"}</b><br>
                ${loc.description || ""}<br><br>
                <b>Variable:</b> ${loc.Measured_variable || "-"}<br>
                <b>Category:</b> ${loc.Measurement_type || "-"}<br>
                ${link}
            `)
            .addTo(map);

        allMarkers.push(marker);
    });

    console.log(`✓ Rendered ${allMarkers.length} markers, skipped ${skippedCount} locations`);

    if (allMarkers.length) {
        const bounds = L.featureGroup(allMarkers).getBounds();
        map.fitBounds(bounds.pad(0.2));
        console.log('Map fitted to bounds:', bounds);
    } else {
        console.warn('⚠ No valid markers to display. Check your locations.json coordinates.');
    }
}

function applyFilters(allData, map, allMarkers) {
    const vars = [...document.getElementById("variableFilter").selectedOptions].map(o => o.value);
    const types = [...document.getElementById("typeFilter").selectedOptions].map(o => o.value);

    const filtered = allData.filter(d =>
        (!vars.length || vars.includes(d.Measured_variable)) &&
        (!types.length || types.includes(d.Measurement_type))
    );

    console.log(`Filtering: ${filtered.length} items match criteria`);
    renderMarkers(filtered, map, allMarkers);
    const panel = document.getElementById("no-results-panel");
    if (filtered.length) {
        panel.classList.add('hidden');
    } else {
        panel.classList.remove('hidden');
    }
}

function resetFilters(allData, map, allMarkers) {
    document.getElementById("variableFilter").selectedIndex = -1;
    document.getElementById("typeFilter").selectedIndex = -1;
    console.log('Filters reset, showing all data');
    renderMarkers(allData, map, allMarkers);
    document.getElementById("no-results-panel").classList.add('hidden');
}

function toggleTheme(map, currentLayer, lightLayer, darkLayer) {
    map.removeLayer(currentLayer);
    const newLayer = currentLayer === lightLayer ? darkLayer : lightLayer;
    newLayer.addTo(map);
    window.mapData.currentLayer = newLayer;
    console.log('Theme toggled to:', newLayer === lightLayer ? 'light' : 'dark');
}

function toggleFilters() {
    const panel = document.getElementById("filter-panel");
    if (panel.style.display === "flex") {
        panel.style.display = "none";
    } else {
        panel.style.display = "flex";
    }
}