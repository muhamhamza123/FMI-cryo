document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing map...');
    initMap();
});

function initMap() {
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
    const map = L.map('map').setView([66.5, 26.0], 6);

    const lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');

    let currentLayer = lightLayer;
    let allData = [];
    let allMarkers = [];

    console.log('Map initialized');

    fetch('/locations')
        .then(r => {
            console.log('Fetch response status:', r.status);
            if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
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

    window.mapData = { map, allData, allMarkers, currentLayer, lightLayer, darkLayer };
}

function populateFilters(data) {
    const varSelect = document.getElementById("variableFilter");
    const typeSelect = document.getElementById("typeFilter");

    const variablesSet = new Set();
    data.forEach(d => {
        if (d.Measured_variable) {
            d.Measured_variable.split(',').map(v => v.trim()).forEach(v => variablesSet.add(v));
        }
    });

    variablesSet.forEach(v => varSelect.add(new Option(v, v)));

    [...new Set(data.map(d => d.Measurement_type).filter(Boolean))]
        .forEach(t => typeSelect.add(new Option(t, t)));
}

function renderMarkers(data, map, allMarkers) {
    allMarkers.forEach(m => map.removeLayer(m));
    allMarkers.length = 0;

    let skippedCount = 0;

    data.forEach((loc, index) => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            skippedCount++;
            console.log(`Skipping location ${index} (invalid coords):`, loc.name);
            return;
        }

        console.log(`Adding marker ${allMarkers.length + 1}:`, loc.name);

        const link = loc.url && loc.url.trim()
            ? `<a href="${loc.url}" target="_blank">Dataset link</a>`
            : `<span>URL pending — contact: <a href="mailto:${loc.contact || 'contact@domain.com'}">${loc.contact || 'contact@domain.com'}</a></span>`;

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
        console.warn('⚠ No valid markers to display.');
    }
}

function applyFilters(allData, map, allMarkers) {
    const selectedVars = [...document.getElementById("variableFilter").selectedOptions].map(o => o.value);
    const selectedTypes = [...document.getElementById("typeFilter").selectedOptions].map(o => o.value);

    const filtered = allData.filter(d => {
        const rowVars = d.Measured_variable ? d.Measured_variable.split(',').map(v => v.trim()) : [];
        const matchesVar = !selectedVars.length || selectedVars.some(v => rowVars.includes(v));
        const matchesType = !selectedTypes.length || selectedTypes.includes(d.Measurement_type);
        return matchesVar && matchesType;
    });

    console.log(`Filtering: ${filtered.length} items match criteria`);
    renderMarkers(filtered, map, allMarkers);

    const panel = document.getElementById("no-results-panel");
    filtered.length ? panel.classList.add('hidden') : panel.classList.remove('hidden');
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
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
}
