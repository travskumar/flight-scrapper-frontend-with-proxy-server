let searchResults = {};
let currentPortal = 'travclan';
let routeCounter = 1;

const airportNames = {
    'DEL': 'Indira Gandhi Airport (DEL), Delhi, India',
    'BOM': 'Chhatrapati Shivaji International Airport (BOM), Mumbai, India',
    'BLR': 'Kempegowda International Airport (BLR), Bangalore, India',
    'MAA': 'Chennai International Airport (MAA), Chennai, India',
    'CCU': 'Netaji Subhas Chandra Bose International Airport (CCU), Kolkata, India',
    'GOI': 'Dabolim Airport (GOI), Goa, India',
    'HYD': 'Rajiv Gandhi International Airport (HYD), Hyderabad, India',
    'COK': 'Cochin International Airport (COK), Kochi, India',
    'PNQ': 'Pune Airport (PNQ), Pune, India',
    'AMD': 'Sardar Vallabhbhai Patel International Airport (AMD), Ahmedabad, India',
    'JAI': 'Jaipur International Airport (JAI), Jaipur, India',
    'LKO': 'Chaudhary Charan Singh International Airport (LKO), Lucknow, India',
    'IXC': 'Chandigarh Airport (IXC), Chandigarh, India',
    'NAG': 'Dr. Babasaheb Ambedkar International Airport (NAG), Nagpur, India',
    'PAT': 'Jay Prakash Narayan International Airport (PAT), Patna, India',
    'BBI': 'Biju Patnaik International Airport (BBI), Bhubaneswar, India',
    'GAU': 'Lokpriya Gopinath Bordoloi International Airport (GAU), Guwahati, India',
    'SXR': 'Srinagar International Airport (SXR), Srinagar, India',
    'TRV': 'Trivandrum International Airport (TRV), Thiruvananthapuram, India',
    'VNS': 'Lal Bahadur Shastri Airport (VNS), Varanasi, India',
    'DXB': 'Dubai International Airport (DXB), Dubai, UAE',
    'SIN': 'Singapore Changi Airport (SIN), Singapore',
    'BKK': 'Suvarnabhumi Airport (BKK), Bangkok, Thailand',
    'KTM': 'Tribhuvan International Airport (KTM), Kathmandu, Nepal',
    'CMB': 'Bandaranaike International Airport (CMB), Colombo, Sri Lanka'
};

const airlineNameMap = {
    '6E': 'Indigo',
    'SG': 'SpiceJet', 
    'IX': 'Air India Express',
    'AI': 'Air India',
    'UK': 'Vistara',
    'G8': 'GoAir',
    'I5': 'AirAsia India',
    '9W': 'Jet Airways',
    'QP': 'Akasa Air',
    'TG': 'Thai Airways International',
    'OD': 'Malindo Air',
    'VN': 'Vietnam Airlines',
    'MH': 'Malaysia Airlines',
    'VJ': 'VietJet Air',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'EY': 'Etihad Airways',
    'QR': 'Qatar Airways',
    'EK': 'Emirates Airlines',
    'GA': 'Garuda Indonesia'
};

document.addEventListener('DOMContentLoaded', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.querySelector('.departure-date-input').value = tomorrow.toISOString().split('T')[0];

    const portalTabs = document.querySelectorAll('.portal-tab');
    portalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            portalTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentPortal = tab.dataset.portal;
            
            document.querySelectorAll('.portal-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${currentPortal}-content`).classList.add('active');
        });
    });

    document.getElementById('searchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await searchAllRoutes();
    });

    document.getElementById('addRouteBtn').addEventListener('click', addRoute);
    document.getElementById('exportTravclanBtn').addEventListener('click', () => exportPortalResults('travclan'));
    document.getElementById('exportTripjackBtn').addEventListener('click', () => exportPortalResults('tripjack'));
    document.getElementById('exportTBOBtn').addEventListener('click', () => exportPortalResults('tbo'));
});

function addRoute() {
    const routesContainer = document.getElementById('routesContainer');
    const newRouteIndex = routeCounter++;
    
    const routeDiv = document.createElement('div');
    routeDiv.className = 'route-item';
    routeDiv.dataset.routeIndex = newRouteIndex;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    routeDiv.innerHTML = `
        <div class="route-header">
            <h4>Route ${newRouteIndex + 1}</h4>
            <button type="button" class="remove-route-btn">✕ Remove</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Source Airport Code</label>
                <input type="text" class="source-input" placeholder="DEL" maxlength="3" required>
            </div>
            <div class="form-group">
                <label>Destination Airport Code</label>
                <input type="text" class="destination-input" placeholder="BOM" maxlength="3" required>
            </div>
            <div class="form-group">
                <label>Departure Date</label>
                <input type="date" class="departure-date-input" value="${tomorrow.toISOString().split('T')[0]}" required>
            </div>
        </div>
    `;
    
    routesContainer.appendChild(routeDiv);
    
    routeDiv.querySelector('.remove-route-btn').addEventListener('click', () => {
        routeDiv.remove();
        updateRouteNumbers();
    });
    
    updateRouteNumbers();
}

function updateRouteNumbers() {
    const routes = document.querySelectorAll('.route-item');
    routes.forEach((route, index) => {
        route.querySelector('h4').textContent = `Route ${index + 1}`;
        route.querySelector('.remove-route-btn').style.display = routes.length > 1 ? 'block' : 'none';
    });
}

async function searchAllRoutes() {
    const routes = [];
    const routeElements = document.querySelectorAll('.route-item');
    
    routeElements.forEach(routeEl => {
        const source = routeEl.querySelector('.source-input').value.toUpperCase();
        const destination = routeEl.querySelector('.destination-input').value.toUpperCase();
        const departureDate = routeEl.querySelector('.departure-date-input').value;
        
        if (source && destination && departureDate) {
            routes.push({ source, destination, departureDate });
        }
    });
    
    if (routes.length === 0) {
        showError('Please add at least one route');
        return;
    }
    
    const searchTravclan = document.getElementById('searchTravclan').checked;
    const searchTripjack = document.getElementById('searchTripjack').checked;
    const searchTBO = document.getElementById('searchTBO').checked;
    
    if (!searchTravclan && !searchTripjack && !searchTBO) {
        showError('Please select at least one portal to search');
        return;
    }
    
    document.getElementById('errorMessage').classList.remove('active');
    document.getElementById('loading').classList.add('active');
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('exportTravclanBtn').disabled = true;
    document.getElementById('exportTripjackBtn').disabled = true;
    document.getElementById('exportTBOBtn').disabled = true;
    
    searchResults = {};
    
    const totalSearches = routes.length * 
        ((searchTravclan ? 1 : 0) + (searchTripjack ? 1 : 0) + (searchTBO ? 1 : 0));
    let completedSearches = 0;
    
    for (const route of routes) {
        const routeKey = `${route.source}-${route.destination}`;
        searchResults[routeKey] = {
            route: route,
            travclan: [],
            tripjack: [],
            tbo: []
        };
        
        const searchPromises = [];
        
        if (searchTravclan) {
            searchPromises.push(
                searchTravclanFlights(route.source, route.destination, route.departureDate)
                    .then(result => {
                        completedSearches++;
                        updateLoadingText(completedSearches, totalSearches);
                        if (result.success && result.flights) {
                            searchResults[routeKey].travclan = result.flights;
                        }
                        return result;
                    })
            );
        }
        
        if (searchTripjack) {
            searchPromises.push(
                searchTripjackFlights(route.source, route.destination, route.departureDate)
                    .then(result => {
                        completedSearches++;
                        updateLoadingText(completedSearches, totalSearches);
                        if (result.success && result.flights) {
                            searchResults[routeKey].tripjack = result.flights;
                        }
                        return result;
                    })
            );
        }
        
        if (searchTBO) {
            searchPromises.push(
                searchTBOFlights(route.source, route.destination, route.departureDate)
                    .then(result => {
                        completedSearches++;
                        updateLoadingText(completedSearches, totalSearches);
                        if (result.success && result.flights) {
                            searchResults[routeKey].tbo = result.flights;
                        }
                        return result;
                    })
            );
        }
        
        await Promise.all(searchPromises);
    }
    
    document.getElementById('loading').classList.remove('active');
    displayAllResults();
    
    const exportData = {
        travclan: [],
        tripjack: [],
        tbo: []
    };
    
    Object.values(searchResults).forEach(routeData => {
        exportData.travclan.push(...routeData.travclan);
        exportData.tripjack.push(...routeData.tripjack);
        exportData.tbo.push(...routeData.tbo);
    });
    
    document.getElementById('exportTravclanBtn').disabled = exportData.travclan.length === 0;
    document.getElementById('exportTripjackBtn').disabled = exportData.tripjack.length === 0;
    document.getElementById('exportTBOBtn').disabled = exportData.tbo.length === 0;
}

function updateLoadingText(completed, total) {
    document.getElementById('loadingText').textContent = 
        `Searching flights... (${completed}/${total} searches completed)`;
}

function displayAllResults() {
    const container = document.getElementById('resultsContainer');
    
    Object.entries(searchResults).forEach(([routeKey, routeData]) => {
        const { route, travclan, tripjack, tbo } = routeData;
        const allFlights = [...travclan, ...tripjack, ...tbo];
        
        if (allFlights.length === 0) return;
        
        allFlights.sort((a, b) => (a.finalFare || a.farePrice) - (b.finalFare || b.farePrice));
        
        const routeSection = document.createElement('div');
        routeSection.className = 'results-section active';
        routeSection.innerHTML = `
            <div class="search-card">
                <h2 style="margin-bottom: 20px;">✈️ ${route.source} → ${route.destination} (${formatDate(route.departureDate)})</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${allFlights.length}</div>
                        <div class="stat-label">Total Flights</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${travclan.length}</div>
                        <div class="stat-label">Travclan</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${tripjack.length}</div>
                        <div class="stat-label">Tripjack</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${tbo.length}</div>
                        <div class="stat-label">TBO</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">₹${allFlights.length > 0 ? 
                            Math.min(...allFlights.map(f => f.finalFare || f.farePrice)).toLocaleString() : '0'}</div>
                        <div class="stat-label">Lowest Fare</div>
                    </div>
                </div>
                
                <div class="flight-grid">
                    ${allFlights.slice(0, 20).map(flight => createFlightCard(flight)).join('')}
                </div>
                
                ${allFlights.length > 20 ? `<p style="text-align: center; margin-top: 20px; color: #666;">Showing top 20 of ${allFlights.length} flights</p>` : ''}
            </div>
        `;
        
        container.appendChild(routeSection);
    });
}

function createFlightCard(flight) {
    return `
        <div class="flight-card">
            <div class="flight-header">
                <div class="airline-info">
                    <div class="airline-logo">${flight.airline.substring(0, 2).toUpperCase()}</div>
                    <div>
                        <div class="flight-number">${flight.flightNumber}</div>
                        <div class="airline-name">${flight.airline}</div>
                    </div>
                </div>
                <div class="price-info">
                    <div class="final-fare">₹${(flight.finalFare || flight.farePrice).toLocaleString()}</div>
                    <div class="fare-type">${flight.fareClass || flight.fareType} - ${flight.portal}</div>
                </div>
            </div>
            
            <div class="flight-details">
                <div class="departure">
                    <div class="city-code">${flight.origin}</div>
                    <div class="time">${flight.departureTime}</div>
                </div>
                <div class="flight-path">
                    <div class="flight-line"></div>
                    <div>
                        <div class="flight-duration">${flight.duration}</div>
                        <div class="stops ${flight.stops === 0 || flight.directIndirect === 'Direct' ? 'non-stop' : ''}">
                            ${flight.directIndirect || (flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`)}
                        </div>
                    </div>
                    <div class="flight-line"></div>
                </div>
                <div class="arrival">
                    <div class="city-code">${flight.destination}</div>
                    <div class="time">${flight.arrivalTime}</div>
                </div>
            </div>
            
            <div class="flight-footer">
                <div class="baggage-info">
                    <span>🎒 Cabin: ${flight.cabinBaggage}</span>
                    <span>🧳 Check-in: ${flight.baggage}</span>
                </div>
                <div class="provider">${flight.provider}</div>
            </div>
        </div>
    `;
}

function exportPortalResults(portal) {
    const allFlights = [];
    const departureDates = new Set();
    
    Object.values(searchResults).forEach(routeData => {
        allFlights.push(...routeData[portal]);
        routeData.route && departureDates.add(routeData.route.departureDate);
    });
    
    if (allFlights.length === 0) {
        showError(`No ${portal} data to export!`);
        return;
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = departureDates.size === 1 
        ? Array.from(departureDates)[0] 
        : `${timestamp}_multiple_dates`;
    
    const csvContent = generateCSV(portal, allFlights);
    const filename = `${portal}_${dateRange}.csv`;
    
    downloadCSV(csvContent, filename);
    showSuccess(`${portal} CSV exported successfully!`);
}

function generateCSV(portal, flights) {
    let headers, rows;
    
    if (portal === 'travclan') {
        headers = ['Portal', 'Flight Number', 'Airline', 'Origin', 'Destination', 'Sector',
            'Date', 'Departure Time', 'Arrival Time', 'Duration', 'Stops',
            'Base Fare', 'Final Fare', 'Fare Type Received', 'FareTypeWeShow',
            'Provider', 'Check-in Baggage', 'Cabin Baggage'];
        
        rows = flights.map(f => {
            // Extract date and times
            const depDate = f.departureTime ? f.departureTime.split(',')[0] : '';
            const depTime = f.departureTime ? f.departureTime.split(',')[1]?.trim() || '' : '';
            const arrTime = f.arrivalTime ? f.arrivalTime.split(',')[1]?.trim() || '' : '';
            
            // Map FareTypeReceived to FareTypeWeShow
            const fareTypeMapping = {
                'OFFER_FARE_WITH_PNR': 'Series Fare',
                'Series Fare': 'Series Fare',
                'Series': 'Others',
                'COUPON': 'Coupon',
                'Corp Fare': 'Special Fare',
                'Corporate': 'Special Fare',
                'Coupon Fare': 'Coupon',
                'Coupon': 'Coupon',
                'Published': 'Published',
                'PUBLISHED': 'Published',
                'SME': 'SME',
                'FLEXI': 'Flexi',
                'CORPORATE_FARE': 'Special Fare',
                'TJ_FLEX': 'Flexi'
            };
            
            const fareTypeWeShow = fareTypeMapping[f.fareIdentifier] || 
                                  fareTypeMapping[f.fareClass] || 
                                  'Others';
            
            return [
                f.portal,
                f.flightNumber,
                f.airline, // No quotes
                f.origin,
                f.destination,
                `${f.origin}-${f.destination}`,
                depDate,
                depTime,
                arrTime,
                f.duration,
                f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`,
                f.baseFare,
                f.finalFare,
                f.fareClass || 'Regular', // This is now "Fare Type Received"
                fareTypeWeShow,           // This is now "FareTypeWeShow"
                f.provider,
                f.baggage || 'N/A',
                f.cabinBaggage || 'N/A'
            ];
        });
    } else if (portal === 'tripjack') {
        headers = ['Portal', 'Flight Number', 'Airline', 'Origin', 'Destination', 'Sector',
            'Date', 'Departure Time', 'Arrival Time', 'Duration', 'Stops',
            'Base Fare', 'Final Fare', 'Net-TDS', 'Fare Type',
            'Provider', 'Check-in Baggage', 'Cabin Baggage'];
        
        rows = flights.map(f => {
            // Extract date and times
            const depDate = f.departureTime ? f.departureTime.split(',')[0] : '';
            const depTime = f.departureTime ? f.departureTime.split(',')[1]?.trim() || '' : '';
            const arrTime = f.arrivalTime ? f.arrivalTime.split(',')[1]?.trim() || '' : '';
            
            return [
                f.portal,
                f.flightNumber, // No quotes, already has underscore separator
                f.airline,      // No quotes
                f.origin,
                f.destination,
                `${f.origin}-${f.destination}`,
                depDate,
                depTime,
                arrTime,
                f.duration,
                f.directIndirect === 'Direct' ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`,
                f.baseFare,
                f.finalFare,
                (f.netMinusTds || 0).toFixed(2),
                f.fareType || f.fareClass || '',
                f.provider,
                f.baggage || 'N/A',
                f.cabinBaggage || 'N/A'
            ];
        });
    } else {
        headers = ['Portal', 'Flight Number', 'Airline', 'Origin', 'Destination', 'Sector',
            'Date', 'Departure Time', 'Arrival Time', 'Duration', 'Stops',
            'Base Fare', 'Final Fare', 'Fare Type', 'Provider',
            'Check-in Baggage', 'Cabin Baggage', 'Cabin Class'];
        
        rows = flights.map(f => {
            // Extract date and times
            const depDate = f.departureTime ? f.departureTime.split(',')[0] : '';
            const depTime = f.departureTime ? f.departureTime.split(',')[1]?.trim() || '' : '';
            const arrTime = f.arrivalTime ? f.arrivalTime.split(',')[1]?.trim() || '' : '';
            
            // Fix flight number format - replace commas with underscores
            const flightNumber = f.flightNumber.replace(/,\s*/g, '_');
            
            return [
                f.portal,
                flightNumber,   // No quotes, commas replaced with underscores
                f.airline,      // No quotes
                f.origin,
                f.destination,
                `${f.origin}-${f.destination}`,
                depDate,
                depTime,
                arrTime,        // No quotes
                f.duration,
                f.directIndirect === 'Direct' ? 'Direct' : 
                    (f.stops === 'Non-Stop' || f.stops === 'non-stop' ? 'Direct' : f.stops),
                f.baseFare,
                f.finalFare,
                f.fareType || 'Published',
                f.provider,
                f.baggage || '15 Kg',
                f.cabinBaggage || '7 Kg',
                f.cabinClass || 'Economy'
            ];
        });
    }
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

async function searchTravclanFlights(source, destination, departureDate) {
    const bearerToken = document.getElementById('travclanToken').value.trim();
    if (!bearerToken) return { success: false, error: 'Travclan token missing' };

    try {
        const result = await fetchTravclanPages({
            endpoint: 'http://localhost:3001/api/travclan/flights',
            bearerToken: bearerToken.startsWith('Bearer ') ? bearerToken : 'Bearer ' + bearerToken,
            source, destination, departureDate
        });

        if (result.success) {
            const flights = processTravclanData(result.data);
            return { success: true, flights };
        }
        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function searchTripjackFlights(source, destination, departureDate) {
    const bearerToken = document.getElementById('tripjackToken').value.trim();
    if (!bearerToken) return { success: false, error: 'Tripjack token missing' };

    try {
        const searchBody = {
            "searchQuery": {
                "cabinClass": "ECONOMY",
                "preferredAirline": [],
                "searchModifiers": {
                    "pfts": ["REGULAR"],
                    "isDirectFlight": false,
                    "isConnectingFlight": false,
                    "sourceId": 0,
                    "pnrCreditInfo": { "pnr": "" },
                    "iiss": false
                },
                "routeInfos": [{
                    "fromCityOrAirport": { "code": source },
                    "toCityOrAirport": { "code": destination },
                    "travelDate": departureDate
                }],
                "paxInfo": { "ADULT": 1, "CHILD": 0, "INFANT": 0 }
            },
            "isNewFlow": false,
            "apiName": "flightList"
        };

        const searchResponse = await fetch('http://localhost:3001/api/tripjack/flights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerToken.startsWith('Bearer ') ? bearerToken : 'Bearer ' + bearerToken
            },
            body: JSON.stringify(searchBody)
        });

        if (!searchResponse.ok) throw new Error(`Tripjack Search Error: ${searchResponse.status}`);

        const searchData = await searchResponse.json();
        
        if (searchData?.payload?.searchResult?.tripInfos?.ONWARD) {
            const flights = processTripjackData(searchData);
            return { success: true, flights };
        }

        const requestId = searchData?.requestId || searchData?.payload?.searchQuery?.requestId || 
                         searchData?.payload?.requestIds?.[0] || searchData?.payload?.requestId;
        
        if (!requestId) throw new Error('No requestId found');

        let retryCount = 0;
        const maxRetries = 15; // Increased from 10
        let lastValidData = null;
        let consecutiveEmptyResults = 0;
        
        while (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Fixed 1 second delay
            
            const resultResponse = await fetch('http://localhost:3001/api/tripjack/flights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken.startsWith('Bearer ') ? bearerToken : 'Bearer ' + bearerToken
                },
                body: JSON.stringify({ "requestId": requestId, "apiName": "flightResult" })
            });

            if (!resultResponse.ok) throw new Error(`Tripjack Result Error: ${resultResponse.status}`);

            const resultData = await resultResponse.json();
            
            if (resultData?.payload?.searchResult?.tripInfos?.ONWARD) {
                const currentTrips = resultData.payload.searchResult.tripInfos.ONWARD;
                
                // Store valid data
                if (currentTrips && currentTrips.length > 0) {
                    lastValidData = resultData;
                    consecutiveEmptyResults = 0;
                } else {
                    consecutiveEmptyResults++;
                }
                
                // Check if search is complete
                const isSearchComplete = resultData?.payload?.searchCompleted === true || 
                                       resultData?.payload?.isSearchCompleted === true ||
                                       resultData?.payload?.status === 'COMPLETED' ||
                                       !resultData?.payload?.retryInSecond ||
                                       resultData?.payload?.retryInSecond === 0;
                
                if (isSearchComplete || consecutiveEmptyResults >= 3) {
                    // Use the last valid data we received
                    if (lastValidData) {
                        const flights = processTripjackData(lastValidData);
                        return { success: true, flights };
                    }
                    break;
                }
            }
            
            retryCount++;
        }
        
        // If we have any valid data, return it
        if (lastValidData) {
            const flights = processTripjackData(lastValidData);
            return { success: true, flights };
        }
        
        throw new Error('Failed to get flight results after maximum retries');
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function searchTBOFlights(source, destination, departureDate) {
    const sessionCookies = document.getElementById('tboCookies').value.trim();
    if (!sessionCookies) return { success: false, error: 'TBO session cookies missing' };

    try {
        const formattedDate = formatDateForTBO(departureDate);
        const originFull = airportNames[source] || `${source} Airport (${source}), India`;
        const destinationFull = airportNames[destination] || `${destination} Airport (${destination}), India`;
        const sessionStampId = Date.now().toString() + Math.floor(Math.random() * 1000);
        const sessionStamp = Date.now().toString() + Math.floor(Math.random() * 1000);

        const formData = {
            'ReturnType': '0',
            'origin': originFull.replace(/\s+/g, '+').replace(/,/g, '%2C').replace(/\(/g, '%28').replace(/\)/g, '%29'),
            'destination': destinationFull.replace(/\s+/g, '+').replace(/,/g, '%2C').replace(/\(/g, '%28').replace(/\)/g, '%29'),
            'departDate': formattedDate,
            'OutBoundTime': '00%3A00%3A00',
            'returnDate': '',
            'InBoundTime': '00%3A00%3A00',
            'hResultFareType': 'RegularFare',
            'hIsSpecialFare': 'False',
            'NoOfAdutls': '1',
            'NoOfChilds': '0',
            'NoOfInfants': '0',
            'CabinClass': '1',
            'GDSPrefferedAirlines': '',
            'showSearchCombination': 'false',
            'SearchCombinationOpen': 'false',
            'GDSPreferredCarrier': 'AI',
            'hDeptDate': formattedDate,
            'hAdultCount': '1',
            'hChildCount': '0',
            'hInfantCount': '0',
            'hsearchForDomestic': 'true',
            'hCabinClass': '1',
            'houtTimefilter': '00%3A00%3A00',
            'hinboundTimefilter': '',
            'hPromotionalPlanType': '0',
            'isLazyLoadingEnable': 'True',
            'pubfareVisibility': 'visibility%3Avisible%3B',
            'showServiceFee': 'False',
            'isIncludeInTax': 'True',
            'offfareVisibility': 'visibility%3Avisible%3B',
            'isB2B2B': 'False',
            'searchType': '0',
            'OriginIsDomestic': 'True',
            'DestinationIsDomestic': 'True',
            'SessionStampId': sessionStampId,
            'TraceId': generateTraceId(),
            'SessionStamp': sessionStamp,
            'IsModifiedSearch': 'true',
            'hDeptdate': '',
            'hReturndate': '',
            'hTravelInfo': '',
            'hAdult': '',
            'hChild': '',
            'hInfant': '',
            'hSwitchToAirportWiseSearch': 'True',
            'loginType': 'Agent',
            'ResultRecommendationType': '2'
        };

        const response = await fetch('http://localhost:3001/api/tbo/flights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TBO-Cookie': sessionCookies
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('TBO session expired. Please login and update cookies.');
            }
            throw new Error(`TBO Search Error: ${response.status}`);
        }

        const htmlContent = await response.text();
        if (htmlContent.length < 5000) {
            throw new Error('Session may have expired.');
        }

        const flights = parseTBOFlightData(htmlContent, departureDate);
        return { success: true, flights };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function fetchTravclanPages(config) {
    try {
        const page1Response = await fetchTravclanPage(config, 1);
        if (!page1Response.ok) throw new Error(`Travclan API Error: ${page1Response.status}`);

        const page1Data = await page1Response.json();
        let allResults = page1Data.response?.results || [];
        const totalPages = page1Data.totalPages || 1;

        if (totalPages === 1) {
            return { success: true, data: { response: { results: allResults }, totalPages } };
        }

        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
            promises.push(
                fetchTravclanPage(config, page)
                    .then(res => res.ok ? res.json() : Promise.reject())
                    .then(data => data.response?.results || [])
                    .catch(() => [])
            );
        }

        const otherResults = await Promise.all(promises);
        for (const results of otherResults) {
            allResults = allResults.concat(results);
        }

        return { success: true, data: { response: { results: allResults }, totalPages } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function fetchTravclanPage(config, page) {
    return fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': config.bearerToken
        },
        body: JSON.stringify({
            directFlight: "false",
            adultCount: "1",
            childCount: "0",
            infantCount: "0",
            flightCabinClass: "1",
            journeyType: 1,
            preferredDepartureTime: config.departureDate + 'T00:00:00',
            origin: config.source,
            destination: config.destination,
            memberCode: "jky5",
            organizationCode: "orjbpe",
            page: page,
            filterBy: {},
            sortBy: {},
            selectedFlights: []
        })
    });
}

function processTravclanData(data) {
    const processedFlights = [];
    if (!data?.response?.results) return processedFlights;

    data.response.results.forEach(flight => {
        const segments = flight.sg || [];
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];
        const flightInfo = firstSeg.al || {};

        flight.priceList?.forEach(price => {
            processedFlights.push({
                portal: 'Travclan',
                flightNumber: `${flightInfo.alC || ''}-${flightInfo.fN || ''}`,
                airline: flightInfo.alN || '',
                baseFare: price.bF || 0,
                publishedFare: price.pF || 0,
                finalFare: price.fF || 0,
                provider: getTravclanProviderName(price.pr, price.db),
                fareClass: price.pFC || 'Regular',
                fareIdentifier: price.fareIdentifier?.name || '',
                origin: firstSeg.or?.aC || '',
                destination: lastSeg.ds?.aC || '',
                departureTime: formatDateTime(firstSeg.or?.dT),
                arrivalTime: formatDateTime(lastSeg.ds?.aT),
                stops: segments.length - 1,
                duration: calculateDuration(firstSeg.or?.dT, lastSeg.ds?.aT),
                baggage: price.baggage?.[0]?.bg || 'N/A',
                cabinBaggage: price.baggage?.[0]?.cBg || 'N/A'
            });
        });
    });

    return processedFlights;
}

function processTripjackData(data) {
    const processedFlights = [];
    
    if (!data?.payload?.searchResult?.tripInfos?.ONWARD) return processedFlights;

    const trips = data.payload.searchResult.tripInfos.ONWARD;

    trips.forEach(trip => {
        const tripInfo = trip.processedTripInfo;
        if (!tripInfo) return;

        const airline = tripInfo.aI?.name || '';
        const airlineCode = tripInfo.aI?.code || '';
        const flightNumbers = tripInfo.fN || [];
        const departureTime = tripInfo.dt;
        const arrivalTime = tripInfo.at;
        const duration = tripInfo.du || 0;
        const origin = tripInfo.da || '';
        const destination = tripInfo.aa || '';
        const stops = tripInfo.st || 0;
        const providers = tripInfo.sups || [];

        if (trip.totalPriceList && Array.isArray(trip.totalPriceList)) {
            trip.totalPriceList.forEach(priceOption => {
                const adultFare = priceOption.fd?.ADULT;
                if (!adultFare) return;

                const matchingPriceInfo = tripInfo.pI?.find(p => p.id === priceOption.id);

                processedFlights.push({
                    portal: 'Tripjack',
                    airline: airline,
                    flightNumber: flightNumbers.join('_'),  // Changed from ', ' to '_'
                    origin: origin,
                    destination: destination,
                    departureTime: formatDateTime(departureTime),
                    arrivalTime: formatDateTime(arrivalTime),
                    duration: `${Math.floor(duration/60)}h ${duration%60}m`,
                    stops: stops,
                    directIndirect: stops === 0 ? 'Direct' : 'Indirect',
                    baseFare: adultFare.fC?.BF || 0,
                    finalFare: adultFare.fC?.TF || 0,
                    netMinusTds: matchingPriceInfo?.net || 0,
                    netFare: adultFare.fC?.NF || 0,  // Added net fare
                    tds: matchingPriceInfo?.tds || 0,
                    fareClass: priceOption.fareIdentifier || matchingPriceInfo?.ft || '',
                    fareType: matchingPriceInfo?.ft || '',
                    provider: providers.join(', '),
                    baggage: adultFare.bI?.iB || 'N/A',
                    cabinBaggage: adultFare.bI?.cB || 'N/A'
                });
            });
        }
    });

    return processedFlights;
}

function parseTBOFlightData(htmlContent, departureDate) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const flightCards = tempDiv.querySelectorAll('.refResultRow');
    if (flightCards.length === 0) return [];

    const processedFlights = [];
    
    flightCards.forEach(flightCard => {
        try {
            const airlineCode = flightCard.querySelector('.airlinecode code')?.textContent?.trim() || 
                              flightCard.querySelector('kbd[id^="airlineCode_"]')?.textContent?.trim() || '';
            
            const flightNumbers = Array.from(flightCard.querySelectorAll('.airlinecode small'))
                .map(el => el.textContent.trim())
                .filter(num => num)
                .join('_'); // Changed from ', ' to '_' for CSV compatibility
            
            const altFlightNumber = flightCard.querySelector('input[id^="allSegmentFltNo_"]')?.value || '';
            const finalFlightNumbers = flightNumbers || altFlightNumber || '';
            
            const airlineName = airlineNameMap[airlineCode] || 
                              flightCard.querySelector('.fn_rht h4')?.textContent?.trim() || 
                              airlineCode || 'Unknown';
            
            const origin = flightCard.querySelector('[id^="OriginAirportCode_"]')?.textContent?.trim() || '';
            const destination = flightCard.querySelector('[id^="DestinationAirportCode_"]')?.textContent?.trim() || '';
            const departureTime = flightCard.querySelector('.fdepbx tt')?.textContent?.trim() || '';
            const arrivalTime = flightCard.querySelector('.farrbx tt')?.textContent?.trim() || '';
            const duration = flightCard.querySelector('[id^="duration_"]')?.textContent?.trim() || '';
            
            // Format departure and arrival times with date in MM/DD/YYYY format
            const formattedDepartureTime = departureTime ? 
                `${formatDateTimeForCSV(departureDate)}, ${departureTime}` : '';
            const formattedArrivalTime = arrivalTime ? 
                `${formatDateTimeForCSV(departureDate)}, ${arrivalTime}` : '';
            
            const stopsElement = flightCard.querySelector('[id^="outBoundStops_"] small') || 
                               flightCard.querySelector('[id^="outBoundStops_"]');
            const stopsText = stopsElement?.textContent?.trim()?.toLowerCase() || 'non-stop';
            const directOrIndirect = stopsText.includes('non-stop') || stopsText === '0' ? 'Direct' : 'Indirect';
            
            const cabinClass = flightCard.querySelector('p[id^="pCabinClass_"]')?.textContent?.trim() || 'Economy';
            
            const priceBoxes = flightCard.querySelectorAll('.flpricebx');
            
            if (priceBoxes.length === 0) {
                const publishFare = flightCard.querySelector('tt[id^="PubPrice_"]')?.textContent?.trim()?.replace(/[₹\s,]/g, '') || '0';
                const offerFare = flightCard.querySelector('tt[id^="OfferPrice_"]')?.textContent?.trim()?.replace(/[₹\s,]/g, '') || '0';
                const fareType = flightCard.querySelector('span[id^="faretype_"]')?.textContent?.trim() || 'Published';
                
                if (parseFloat(offerFare) > 0) {
                    processedFlights.push({
                        portal: 'TBO',
                        flightNumber: `${airlineCode}-${finalFlightNumbers}`,
                        airline: airlineName,
                        origin: origin,
                        destination: destination,
                        departureTime: formattedDepartureTime,
                        arrivalTime: formattedArrivalTime,
                        duration: duration,
                        stops: stopsText,
                        directIndirect: directOrIndirect,
                        baseFare: parseFloat(publishFare) || 0,
                        finalFare: parseFloat(offerFare) || 0,
                        netTDS: 0,
                        fareType: fareType,
                        provider: 'TBO',
                        baggage: '15 Kg',
                        cabinBaggage: '7 Kg',
                        cabinClass: cabinClass
                    });
                }
            } else {
                priceBoxes.forEach(priceBox => {
                    const publishFare = priceBox.querySelector('tt[id^="PubPrice_"]')?.textContent?.trim()?.replace(/[₹\s,]/g, '') || '';
                    const offerFare = priceBox.querySelector('tt[id^="OfferPrice_"]')?.textContent?.trim()?.replace(/[₹\s,]/g, '') || '';
                    const fareType = priceBox.querySelector('span[id^="faretype_"]')?.textContent?.trim() || '';
                    
                    if (!publishFare && !offerFare && !fareType) return;
                    
                    const baggage = priceBox.querySelector('td[id^="checkInBaggage_"]')?.textContent?.trim() || '15 Kg';
                    const cabinBaggage = priceBox.querySelector('td[id^="cabinBaggage_"]')?.textContent?.trim() || '7 Kg';
                    
                    if (parseFloat(offerFare) > 0 && origin && destination) {
                        processedFlights.push({
                            portal: 'TBO',
                            flightNumber: `${airlineCode}-${finalFlightNumbers}`,
                            airline: airlineName,
                            origin: origin,
                            destination: destination,
                            departureTime: formattedDepartureTime,
                            arrivalTime: formattedArrivalTime,
                            duration: duration,
                            stops: stopsText,
                            directIndirect: directOrIndirect,
                            baseFare: parseFloat(publishFare) || 0,
                            finalFare: parseFloat(offerFare) || 0,
                            netTDS: 0,
                            fareType: fareType || 'Published',
                            provider: `TBO-${fareType || 'Default'}`,
                            baggage: baggage,
                            cabinBaggage: cabinBaggage,
                            cabinClass: cabinClass
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error processing TBO flight card:', error);
        }
    });

    return processedFlights;
}

function getTravclanProviderName(pr, db) {
    const providerMap = {
        'P1D1': 'TC_TBO_API',
        'P1D2': 'TC_TBO_GDS',
        'P2D1': 'TC_Tripjack_API',
        'P2D2': 'TC_Tripjack_GDS',
        'P3D1': 'TC_EMT_API',
        'P3D2': 'TC_EMT_GDS',
        'P4D1': 'TC_Via_API',
        'P4D2': 'TC_Via_GDS'
    };
    return providerMap[`${pr}${db}`] || 'Unknown Provider';
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (e) {
        return dateTimeStr;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

function formatDateForTBO(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

function calculateDuration(departure, arrival) {
    if (!departure || !arrival) return '';
    try {
        const dep = new Date(departure);
        const arr = new Date(arrival);
        const diff = arr - dep;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    } catch (e) {
        return '';
    }
}

function generateTraceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDateTimeForCSV(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    } catch (e) {
        return dateStr;
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.background = '#d4edda';
    errorMessage.style.color = '#155724';
    errorMessage.classList.add('active');
    setTimeout(() => {
        errorMessage.classList.remove('active');
        errorMessage.style.background = '';
        errorMessage.style.color = '';
    }, 3000);
}