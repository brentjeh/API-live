// Imports
const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path'); // Importeer het path-module om paden te manipuleren
const port = 3002;

const rijksmuseumApiKey = 'WPohdQuh';

// Stel de map voor statische bestanden in
app.use(express.static(path.join(__dirname, 'public')));

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(`https://www.rijksmuseum.nl/api/nl/collection?key=${rijksmuseumApiKey}&type=schilderij&ps=40`);
        const artworks = response.data.artObjects.map(artwork => ({
            title: artwork.title,
            maker: artwork.principalOrFirstMaker,
            imageUrl: artwork.webImage.url,
            id: artwork.objectNumber // Voeg de ID van elk schilderij toe
        }));
        res.render('index', { artworks: artworks || [] });
    } catch (error) {
        console.error('Fout bij het ophalen van kunstwerken:', error.message);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het ophalen van de kunstwerken' });
    }
}); 

app.get('/artwork/:id', async (req, res) => {
    try {
        let artworkId = req.params.id; 
        artworkId = artworkId.replace(/^nl-/, '');

        const response = await axios.get(`https://www.rijksmuseum.nl/api/nl/collection/${artworkId}?key=${rijksmuseumApiKey}`);
        const artworkData = response.data.artObject;

        // Functie om te controleren of een eigenschap leeg is
        const isEmpty = (property) => !property || property.length === 0;

        // Functie om 'Deze informatie is helaas niet beschikbaar' toe te voegen als de eigenschap leeg is
        const addNotAvailableText = (property) => isEmpty(property) ? 'Deze informatie is helaas niet beschikbaar' : property;

        // Voeg 'Deze informatie is helaas niet beschikbaar' toe voor verschillende eigenschappen
        artworkData.principalMakers[0].placeOfBirth = addNotAvailableText(artworkData.principalMakers[0].placeOfBirth);
        artworkData.principalMakers[0].dateOfBirth = addNotAvailableText(artworkData.principalMakers[0].dateOfBirth);
        artworkData.principalMakers[0].placeOfDeath = addNotAvailableText(artworkData.principalMakers[0].placeOfDeath);
        artworkData.principalMakers[0].dateOfDeath = addNotAvailableText(artworkData.principalMakers[0].dateOfDeath);
        artworkData.principalMakers[0].occupation = addNotAvailableText(artworkData.principalMakers[0].occupation);
        artworkData.materials = addNotAvailableText(artworkData.materials);
        artworkData.acquisition.creditLine = addNotAvailableText(artworkData.acquisition.creditLine);
        artworkData.objectCollection = addNotAvailableText(artworkData.objectCollection);

        res.render('artwork', { artwork: artworkData });
    } catch (error) {
        console.error('Fout bij het ophalen van het kunstwerk:', error.message);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het ophalen van het kunstwerk' });
    }
});

app.get('/search', async (req, res) => {
    try {
        const title = req.query.title; // Haal de zoekterm op uit de query
        const response = await axios.get(`https://www.rijksmuseum.nl/api/nl/collection?key=${rijksmuseumApiKey}&q=${title}&type=schilderij&ps=40`); // Voeg '&type=schilderij' toe om alleen schilderijen te zoeken
        const artworks = response.data.artObjects;  
        res.json({ artworks }); // Stuur kunstwerken als JSON terug
    } catch (error) {
        console.error('Fout bij het zoeken naar kunstwerken:', error.message);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het zoeken naar de kunstwerken' });
    }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius van de aarde in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Afstand in kilometers
    return distance;
}

// Endpoint voor het verkrijgen van schilderijen binnen 50 km straal van de gebruiker
app.get('/nearby-artworks', async (req, res) => {
    try {
        const { latitude, longitude } = req.query; // Ontvang de locatiegegevens van de gebruiker
        const response = await axios.get(`https://www.rijksmuseum.nl/api/nl/collection?key=${rijksmuseumApiKey}&type=schilderij&ps=40`);
        const artworks = response.data.artObjects.map(artwork => ({
            title: artwork.title,
            maker: artwork.principalOrFirstMaker,
            imageUrl: artwork.webImage.url,
            id: artwork.objectNumber, // Voeg de ID van elk schilderij toe
            productionPlaces: artwork.productionPlaces // Voeg productieplaatsen toe aan het schilderij
        }));

        // Filter de schilderijen op basis van de productieplaatsen binnen 50 km straal van de gebruiker
        const nearbyArtworks = artworks.filter(artwork => {
            if (!artwork.productionPlaces || artwork.productionPlaces.length === 0) {
                return false; // Als er geen productieplaatsen zijn, sla dit schilderij over
            }
            // Controleer of ten minste één productieplaats binnen 50 km van de gebruiker ligt
            return artwork.productionPlaces.some(place => {
                // Veronderstel dat plaats een array [latitude, longitude] is
                const [placeLat, placeLon] = place;
                const distance = calculateDistance(latitude, longitude, placeLat, placeLon);
                return distance <= 50; // Controleer of de afstand binnen 50 km is
            });
        });

        res.json({ artworks: nearbyArtworks }); // Stuur kunstwerken binnen 50 km terug als JSON
    } catch (error) {
        console.error('Fout bij het ophalen van kunstwerken binnen 50 km:', error.message);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het ophalen van de kunstwerken binnen 50 km' });
    }
});

// Luister op poort
app.listen(port, () => console.info(`Luisterende op poort ${port}`));

