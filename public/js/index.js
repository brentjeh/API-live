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

// Kunstwerken automatisch laden wanneer de pagina wordt geladen
window.addEventListener('DOMContentLoaded', () => {
    // Laad kunstwerken wanneer de pagina wordt geladen
    searchArtworks('');
});
