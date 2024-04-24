import 'https://flackr.github.io/scroll-timeline/dist/scroll-timeline.js';

function setupScrollTracking() {
    const scrollTracker = document.querySelector('.scroll-tracker');
    const scrollTrackingTimeline = new ScrollTimeline({
        source: document.scrollingElement,
        orientation: 'block',  
        scrollOffsets: [CSS.percent(0), CSS.percent(100)]
    });

    scrollTracker.animate(
        {
            transform: ['scaleX(0)', 'scaleX(1)']
        },
        {
            duration: 1,
            timeline: scrollTrackingTimeline,
        }
    );
}

document.addEventListener('DOMContentLoaded', setupScrollTracking);

// Functie om zoekresultaten op te halen en weer te geven
async function searchArtworks(query) {
    try {
        const response = await fetch(`/search?title=${query}`);
        const data = await response.json();
        displayArtworks(data.artworks); // Geef de kunstwerken weer
    } catch (error) {
        console.error('Fout bij het zoeken naar kunstwerken:', error.message);
    }
}

// Zoekbalk event listener
const searchInput = document.querySelector('input[name="title"]');
searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim(); // Haal de zoekopdracht op en verwijder witruimte aan het begin en einde
    if (query.length > 0) {
        searchArtworks(query); // Zoekresultaten ophalen als de zoekopdracht niet leeg is
    } else {
        searchArtworks(''); // Laad alle kunstwerken als de zoekopdracht leeg is
    }
});

// Functie om kunstwerken weer te geven
function displayArtworks(artworks) {
    const artworksList = document.getElementById('artworksList');
    const noResultsMessage = document.getElementById('noResultsMessage');
    artworksList.innerHTML = ''; // Leeg de huidige lijst
    if (artworks.length === 0) {
        noResultsMessage.style.display = 'flex';
    } else {
        noResultsMessage.style.display = 'none';
        artworks.forEach(artwork => {
            const li = document.createElement('li');
            li.innerHTML = `
            <a href="/artwork/${artwork.id}">
                <h2>${artwork.title}</h2>
                <img src="${artwork.webImage.url}" alt="${artwork.title}">
            </a>
            `;
            artworksList.appendChild(li);
        });
    }
}

document.getElementById('nearbyArtworksButton').addEventListener('click', async () => {
    try {
        // Vraag de huidige locatie van de gebruiker op
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        // Stuur de coördinaten van de gebruiker naar de server om kunstwerken in de buurt op te halen
        const response = await fetch(`/artworks-near-me?latitude=${latitude}&longitude=${longitude}`);
        const data = await response.json();
        displayArtworks(data.artworks); // Weergeef de kunstwerken binnen 50 km straal
    } catch (error) {
        console.error('Fout bij het ophalen van kunstwerken in de buurt:', error.message);
    }
});

// Functie om de huidige locatie van de gebruiker op te halen
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// Kunstwerken automatisch laden wanneer de pagina wordt geladen
window.addEventListener('DOMContentLoaded', () => {
    // Laad kunstwerken wanneer de pagina wordt geladen
    searchArtworks('');
});
