// flight-search.js

// Global variables
let travclanFlightData = [];
let tripjackFlightData = [];
let tboFlightData = [];
let currentPortal = 'travclan';

// Airport name mappings for TBO
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

// DOM elements
const form = document.getElementById('searchForm');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const resultsSection = document.getElementById('resultsSection');
const exportTravclanBtn = document.getElementById('exportTravclanBtn');
const exportTripjackBtn = document.getElementById('exportTripjackBtn');
const exportTBOBtn = document.getElementById('exportTBOBtn');
const statsGrid = document.getElementById('statsGrid');
const flightGrid = document.getElementById('flightGrid');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('departureDate').value = tomorrow.toISOString().split('T')[0];

    // Portal tabs
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

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await searchFlights();
    });

    // Export buttons
    exportTravclanBtn.addEventListener('click', () => exportToCSV('travclan'));
    exportTripjackBtn.addEventListener('click', () => exportToCSV('tripjack'));
    exportTBOBtn.addEventListener('click', () => exportToCSV('tbo'));
});

// Main search function
async function searchFlights() {
    const source = document.getElementById('source').value.toUpperCase();
    const destination = document.getElementById('destination').value.toUpperCase();
    const departureDate = document.getElementById('departureDate').value;
    const searchTravclan = document.getElementById('searchTravclan').checked;
    const searchTripjack = document.getElementById('searchTripjack').checked;
    const searchTBO = document.getElementById('searchTBO').checked;

    if (!searchTravclan && !searchTripjack && !searchTBO) {
        showError('Please select at least one portal to search');
        return;
    }

    // Reset UI
    errorMessage.classList.remove('active');
    loading.classList.add('active');
    resultsSection.classList.remove('active');
    exportTravclanBtn.disabled = true;
    exportTripjackBtn.disabled = true;
    exportTBOBtn.disabled = true;
    travclanFlightData = [];
    tripjackFlightData = [];
    tboFlightData = [];

    const searchPromises = [];
    let searchText = 'Searching flights on: ';
    const portalsToSearch = [];

    if (searchTravclan) {
        portalsToSearch.push('Travclan');
        searchPromises.push(searchTravclanFlights(source, destination, departureDate));
    }
    
    if (searchTripjack) {
        portalsToSearch.push('Tripjack');
        searchPromises.push(searchTripjackFlights(source, destination, departureDate));
    }

    if (searchTBO) {
        portalsToSearch.push('TBO');
        searchPromises.push(searchTBOFlights(source, destination, departureDate));
    }

    loadingText.textContent = searchText + portalsToSearch.join(', ') + '...';

    try {
        const results = await Promise.all(searchPromises);
        
        let resultIndex = 0;
        let travclanResult = searchTravclan ? results[resultIndex++] : { success: false };
        let tripjackResult = searchTripjack ? results[resultIndex++] : { success: false };
        let tboResult = searchTBO ? results[resultIndex++] : { success: false };

        // Display results
        displayResults(travclanResult, tripjackResult, tboResult, searchTravclan, searchTripjack, searchTBO);

        // Enable export buttons if data is available
        if (travclanFlightData.length > 0) exportTravclanBtn.disabled = false;
        if (tripjackFlightData.length > 0) exportTripjackBtn.disabled = false;
        if (tboFlightData.length > 0) exportTBOBtn.disabled = false;

    } catch (error) {
        showError(error.message);
    } finally {
        loading.classList.remove('active');
    }
}

// TBO Search Function - Fixed to match exact cURL format
async function searchTBOFlights(source, destination, departureDate) {
    console.log('🚀 Starting TBO flight search...');
    console.log(`  📍 Route: ${source} → ${destination}`);
    console.log(`  📅 Date: ${departureDate}`);
    
    const sessionCookies = document.getElementById('tboCookies').value.trim();
    if (!sessionCookies) {
        console.log('❌ TBO session cookies missing');
        return { success: false, error: 'TBO session cookies missing' };
    }

    const endpoint = 'http://localhost:3001/api/tbo/flights';
    console.log(`  🔗 Using endpoint: ${endpoint}`);

    try {
        const formattedDate = formatDateForTBO(departureDate);
        console.log(`  📅 Formatted date for TBO: ${formattedDate}`);

        // Get full airport names
        const originFull = airportNames[source] || `${source} Airport (${source}), India`;
        const destinationFull = airportNames[destination] || `${destination} Airport (${destination}), India`;

        // Generate session IDs like TBO does
        const sessionStampId = Date.now().toString() + Math.floor(Math.random() * 1000);
        const sessionStamp = Date.now().toString() + Math.floor(Math.random() * 1000);

        // Prepare form data EXACTLY as TBO expects - already URL encoded
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

        console.log('  📤 Sending TBO search request...');
        console.log('  📤 Form data:', formData);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TBO-Cookie': sessionCookies
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify(formData)
        });

        console.log(`  📥 TBO response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ TBO search error:', errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    throw new Error(errorJson.message || errorJson.error);
                }
            } catch (e) {
                // Not JSON, use original error
            }
            
            if (response.status === 401 || errorText.includes('login')) {
                throw new Error('TBO session expired. Please login to TBO and update session cookies.');
            }
            
            throw new Error(`TBO Search Error: ${response.status}`);
        }

        const htmlContent = await response.text();
        console.log(`  📥 Response HTML length: ${htmlContent.length} characters`);

        if (htmlContent.length < 5000) {
            throw new Error('Received unexpectedly short response from TBO. Session may have expired.');
        }

        // Parse the HTML content
        const parsedData = await parseTBOFlightData(htmlContent);
        tboFlightData = parsedData;

        console.log(`✅ TBO API fetched data successfully`);
        console.log(`  ✈️ Processed ${tboFlightData.length} flight options`);

        return { success: true, flights: tboFlightData };

    } catch (error) {
        console.error('❌ TBO error:', error);
        return { success: false, error: error.message };
    }
}

// Parse TBO flight data from HTML
async function parseTBOFlightData(htmlContent) {
    console.log('  📊 Parsing TBO flight data...');
    
    // Create a temporary container to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Use the exact selector that works - without .selected
    const flightCards = tempDiv.querySelectorAll('.flightresult_grid.result_p.mb-1.refResultRow');
    console.log(`  📊 Found ${flightCards.length} flight cards using TBO specific selector`);

    if (flightCards.length === 0) {
        // Try alternative selectors if the specific one doesn't work
        const alternativeSelectors = [
            '.result_p',
            '.flightresult_grid',
            '.refResultRow',
            '[class*="flightresult"]'
        ];
        
        for (const selector of alternativeSelectors) {
            const cards = tempDiv.querySelectorAll(selector);
            if (cards.length > 0) {
                console.log(`  📊 Found ${cards.length} flight cards using fallback selector: ${selector}`);
                return parseTBOFlightCardsAlternative(cards);
            }
        }
        
        // Check for error indicators
        if (htmlContent.includes('login') || htmlContent.includes('Login')) {
            throw new Error('Received login page - TBO session cookies may be expired');
        }
        if (htmlContent.includes('No flights found') || htmlContent.includes('No results')) {
            console.log('  ℹ️ No flights found for the selected route/date');
            return [];
        }
        
        console.log('  ⚠️ No flight cards found');
        return [];
    }

    const processedFlights = [];
    
    flightCards.forEach((flight, index) => {
        try {
            // Extract data using exact selectors from your working code
            const airlineCode = flight.querySelector('kbd[id^="airlineCode_"]')?.textContent?.trim() || '';
            const flightNumber = flight.querySelector('input[id^="allSegmentFltNo_"]')?.value || '';
            const flightFullNumber = airlineCode && flightNumber ? `${airlineCode}-${flightNumber}` : 'Unknown';
            
            const airlineName = flight.querySelector('.fn_rht h4')?.textContent?.trim() || 
                              flight.querySelector('.airline-name')?.textContent?.trim() || 
                              'Unknown';
            
            const origin = flight.querySelector('span[id^="OriginAirportCode_"]')?.textContent?.trim() || '';
            const destination = flight.querySelector('span[id^="DestinationAirportCode_"]')?.textContent?.trim() || '';
            
            const departureTime = flight.querySelector('.fdepbx tt')?.textContent?.trim() || '';
            const arrivalTime = flight.querySelector('.farrbx tt')?.textContent?.trim() || '';
            const duration = flight.querySelector('tt[id^="duration_"]')?.textContent?.trim() || '';
            
            // Check for stops - TBO might show this differently
            const stopsElement = flight.querySelector('span[id^="outBoundStops_"]') || 
                               flight.querySelector('[id*="stops"]') ||
                               flight.querySelector('.stops');
            const stopsText = stopsElement ? stopsElement.textContent.trim() : '';
            const isDirect = !stopsText || stopsText === '0' || stopsText.toLowerCase().includes('non') ? 'Direct' : 'Indirect';
            
            // Fare information
            const fareSummary = flight.querySelector('input[id^="FareSummaryValue_"]')?.value || '';
            const baseFare = fareSummary ? parseFloat(fareSummary.split('|')[0]) || 0 : 0;
            
            const finalFareText = flight.querySelector('tt[id^="OfferPrice_"]')?.textContent?.trim() || '';
            const finalFare = finalFareText ? parseFloat(finalFareText.replace(/[₹,]/g, '')) || 0 : 0;
            
            const fareType = flight.querySelector('span[id^="faretype_"]')?.textContent?.trim() || 'Published';
            
            // Baggage info - note the IDs might be dynamic
            const baggage = flight.querySelector('td[id^="checkInBaggage_"]')?.textContent?.trim() || 
                          'Not specified';
            
            const cabinBaggage = flight.querySelector('td[id^="cabinBaggage_"]')?.textContent?.trim() || 
                               'Included';

            const flightData = {
                portal: 'TBO',
                flightNumber: flightFullNumber,
                airline: airlineName,
                origin: origin,
                destination: destination,
                departureTime: departureTime,
                arrivalTime: arrivalTime,
                duration: duration,
                stops: stopsText || '0',
                directIndirect: isDirect,
                baseFare: baseFare,
                finalFare: finalFare,
                netTDS: 0,
                fareType: fareType,
                provider: 'TBO',
                baggage: baggage,
                cabinBaggage: cabinBaggage
            };

            // Only add if we have valid data
            if (flightFullNumber !== 'Unknown' && origin && destination && finalFare > 0) {
                processedFlights.push(flightData);
                console.log(`  ✈️ Processed TBO flight ${index + 1}: ${airlineName} ${flightFullNumber} - ₹${finalFare}`);
            }
        } catch (error) {
            console.error(`  ❌ Error processing TBO flight card ${index + 1}: ${error.message}`);
        }
    });

    console.log(`  📊 Successfully parsed ${processedFlights.length} TBO flights`);
    return processedFlights;
}

// Alternative parsing for different TBO page structures
function parseTBOFlightCardsAlternative(cards) {
    const processedFlights = [];
    
    cards.forEach((card, index) => {
        try {
            // Try multiple selector patterns
            const getTextContent = (selectors) => {
                for (const selector of selectors) {
                    const element = card.querySelector(selector);
                    if (element) return element.textContent.trim();
                }
                return '';
            };
            
            const getValue = (selectors) => {
                for (const selector of selectors) {
                    const element = card.querySelector(selector);
                    if (element && element.value) return element.value;
                }
                return '';
            };

            // Airline and flight number
            const airlineCode = getTextContent([
                'kbd[id^="airlineCode_"]',
                '.airlinecode',
                '[class*="airline-code"]'
            ]);
            
            const flightNumber = getValue([
                'input[id^="allSegmentFltNo_"]',
                'input[name*="flightNumber"]'
            ]) || getTextContent([
                '[class*="flight-number"]',
                '.flight-number'
            ]);
            
            const flightFullNumber = airlineCode && flightNumber ? 
                `${airlineCode}-${flightNumber}` : 
                getTextContent(['.flight-code', '[class*="flight-code"]']) || 'Unknown';
            
            const airlineName = getTextContent([
                '.fn_rht h4',
                '.flightname .fn_rht .mobile_not',
                '.airline-name',
                '[class*="airline-name"]'
            ]) || 'Unknown';

            // Routes
            const origin = getTextContent([
                'span[id^="OriginAirportCode_"]',
                '#OriginAirportCode_0',
                '.fdepbx .fs-14',
                '[class*="origin"]'
            ]).match(/[A-Z]{3}/)?.[0] || '';
            
            const destination = getTextContent([
                'span[id^="DestinationAirportCode_"]',
                '#DestinationAirportCode_0',
                '.farrbx .fs-14',
                '[class*="destination"]'
            ]).match(/[A-Z]{3}/)?.[0] || '';

            // Times
            const departureTime = getTextContent([
                '.fdepbx tt',
                '[class*="depart"] time',
                '[class*="departure-time"]'
            ]) || '';
            
            const arrivalTime = getTextContent([
                '.farrbx tt',
                '[class*="arriv"] time',
                '[class*="arrival-time"]'
            ]) || '';

            // Duration and stops
            const duration = getTextContent([
                'tt[id^="duration_"]',
                '#duration_0',
                '.dur_time tt',
                '[class*="duration"]'
            ]) || '';
            
            const stopsText = getTextContent([
                'span[id^="outBoundStops_"]',
                '#outBoundStops_0',
                '[class*="stops"]'
            ]);
            const stops = stopsText || 'Non-Stop';
            const isDirect = stops === 'Non-Stop' || stops === '' ? 'Direct' : 'Indirect';

            // Prices
            const fareSummary = getValue([
                'input[id^="FareSummaryValue_"]',
                'input[name*="fareSummary"]'
            ]);
            const baseFare = fareSummary ? parseFloat(fareSummary.split('|')[0]) || 0 : 0;
            
            const finalFareText = getTextContent([
                'tt[id^="OfferPrice_"]',
                '#OfferPrice_0',
                '[class*="offer-price"]',
                '[class*="final-fare"]'
            ]);
            const finalFare = finalFareText ? parseFloat(finalFareText.replace(/[₹,]/g, '')) || 0 : baseFare;

            // Fare type
            const fareType = getTextContent([
                'span[id^="faretype_"]',
                '#faretype_0',
                '[class*="fare-type"]'
            ]) || 'Published';

            // Baggage
            const baggage = getTextContent([
                'td[id^="checkInBaggage_"]',
                '#checkInBaggage_0_1',
                '[class*="baggage"]'
            ]) || 'Not specified';
            
            const cabinBaggage = getTextContent([
                'td[id^="cabinBaggage_"]',
                '#cabinBaggage_0_1',
                '[class*="cabin-baggage"]'
            ]) || 'Included';

            const flightData = {
                portal: 'TBO',
                flightNumber: flightFullNumber,
                airline: airlineName,
                origin: origin,
                destination: destination,
                departureTime: departureTime,
                arrivalTime: arrivalTime,
                duration: duration,
                stops: stops,
                directIndirect: isDirect,
                baseFare: baseFare,
                finalFare: finalFare,
                netTDS: 0,
                fareType: fareType,
                provider: 'TBO',
                baggage: baggage,
                cabinBaggage: cabinBaggage
            };

            if (flightFullNumber !== 'Unknown' && origin && destination && finalFare > 0) {
                processedFlights.push(flightData);
                console.log(`  ✈️ Processed TBO flight ${index + 1}: ${airlineName} ${flightFullNumber}`);
            }
        } catch (error) {
            console.error(`  ❌ Error processing flight card ${index + 1}: ${error.message}`);
        }
    });
    
    return processedFlights;
}

// Travclan search function
async function searchTravclanFlights(source, destination, departureDate) {
    console.log('🚀 Starting Travclan flight search...');
    console.log(`  📍 Route: ${source} → ${destination}`);
    console.log(`  📅 Date: ${departureDate}`);
    
    const bearerToken = document.getElementById('travclanToken').value.trim();
    if (!bearerToken) {
        console.log('❌ Travclan token missing');
        return { success: false, error: 'Travclan token missing' };
    }

    const endpoint = 'http://localhost:3001/api/travclan/flights';
    console.log(`  🔗 Using endpoint: ${endpoint}`);

    try {
        const result = await fetchTravclanPages({
            endpoint: endpoint,
            bearerToken: bearerToken.startsWith('Bearer ') ? bearerToken : 'Bearer ' + bearerToken,
            source: source,
            destination: destination,
            departureDate: departureDate
        });

        if (result.success) {
            console.log(`✅ Travclan API fetched data successfully`);
            console.log(`  📊 Total results: ${result.data.response?.results?.length || 0}`);
            console.log(`  📄 Total pages: ${result.data.totalPages || 1}`);
            
            travclanFlightData = processTravclanData(result.data);
            console.log(`  ✈️ Processed ${travclanFlightData.length} flight options`);
            
            return { success: true, data: result.data, flights: travclanFlightData };
        } else {
            console.log(`❌ Travclan API failed: ${result.error}`);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('❌ Travclan error:', error);
        return { success: false, error: error.message };
    }
}

// Tripjack search function
async function searchTripjackFlights(source, destination, departureDate) {
    console.log('🚀 Starting Tripjack flight search...');
    console.log(`  📍 Route: ${source} → ${destination}`);
    console.log(`  📅 Date: ${departureDate}`);
    
    const bearerToken = document.getElementById('tripjackToken').value.trim();
    if (!bearerToken) {
        console.log('❌ Tripjack token missing');
        return { success: false, error: 'Tripjack token missing' };
    }

    const endpoint = 'http://localhost:3001/api/tripjack/flights';
    console.log(`  🔗 Using endpoint: ${endpoint}`);

    try {
        // Step 1: Search for flights using flightList API
        console.log('  📤 Step 1: Initiating flight search with flightList API...');
        
        const searchBody = {
            "searchQuery": {
                "cabinClass": "ECONOMY",
                "preferredAirline": [],
                "searchModifiers": {
                    "pfts": ["REGULAR"],
                    "isDirectFlight": false,
                    "isConnectingFlight": false,
                    "sourceId": 0,
                    "pnrCreditInfo": {
                        "pnr": ""
                    },
                    "iiss": false
                },
                "routeInfos": [{
                    "fromCityOrAirport": {
                        "code": source
                    },
                    "toCityOrAirport": {
                        "code": destination
                    },
                    "travelDate": departureDate
                }],
                "paxInfo": {
                    "ADULT": 1,
                    "CHILD": 0,
                    "INFANT": 0
                }
            },
            "isNewFlow": false,
            "apiName": "flightList"
        };

        const searchResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerToken.startsWith('Bearer ') ? bearerToken : 'Bearer ' + bearerToken
            },
            body: JSON.stringify(searchBody)
        });

        console.log(`  📥 Search response status: ${searchResponse.status}`);

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('❌ Tripjack search error:', errorText);
            throw new Error(`Tripjack Search Error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        console.log('  📥 Search response received');

        // Check if we got direct results or need to fetch with requestId
        if (searchData?.payload?.searchResult?.tripInfos?.ONWARD) {
            console.log('✅ Direct flight results received in flightList response');
            tripjackFlightData = processTripjackData(searchData);
            console.log(`  ✈️ Total processed Tripjack flights: ${tripjackFlightData.length}`);
            return { success: true, data: searchData, flights: tripjackFlightData };
        }

        // Extract requestId
        const requestId = searchData?.requestId || 
                         searchData?.payload?.searchQuery?.requestId || 
                         searchData?.payload?.requestIds?.[0] ||
                         searchData?.payload?.requestId;
        
        if (!requestId) {
            console.error('❌ No requestId found in search response');
            throw new Error('No requestId found in search response');
        }

        console.log(`  ✅ Got requestId: ${requestId}`);

        // Step 2: Fetch flight results using requestId with retry mechanism
        console.log('  📤 Step 2: Fetching flight results with requestId...');
        
        let retryCount = 0;
        const maxRetries = 10;
        let resultData = null;
        
        while (retryCount < maxRetries) {
            const resultBody = {
                "requestId": requestId,
                "apiName": "flightResult"
            };

            const resultResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': bearerToken.startsWith('Bearer ') ? bearerToken : 'Bearer ' + bearerToken
                },
                body: JSON.stringify(resultBody)
            });

            console.log(`  📥 Result response status: ${resultResponse.status}`);

            if (!resultResponse.ok) {
                const errorText = await resultResponse.text();
                console.error('❌ Tripjack result error:', errorText);
                throw new Error(`Tripjack Result Error: ${resultResponse.status}`);
            }

            resultData = await resultResponse.json();
            
            // Check if we have flight results
            if (resultData?.payload?.searchResult?.tripInfos?.ONWARD) {
                console.log('✅ Flight results received!');
                break;
            }
            
            // Check if we need to retry
            const retryInSeconds = resultData?.payload?.retryInSecond || 0;
            if (retryInSeconds > 0 && retryCount < maxRetries - 1) {
                console.log(`  ⏳ Results not ready yet. Waiting ${retryInSeconds} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryInSeconds * 1000));
                retryCount++;
            } else {
                break;
            }
        }
        
        if (!resultData || !resultData?.payload?.searchResult?.tripInfos?.ONWARD) {
            throw new Error('Failed to get flight results after maximum retries');
        }

        console.log('✅ Tripjack API fetched results successfully');
        
        tripjackFlightData = processTripjackData(resultData);
        console.log(`  ✈️ Total processed Tripjack flights: ${tripjackFlightData.length}`);
        
        return { success: true, data: resultData, flights: tripjackFlightData };

    } catch (error) {
        console.error('❌ Tripjack error:', error);
        console.error('Error stack:', error.stack);
        return { success: false, error: error.message };
    }
}

// Fetch Travclan pages
async function fetchTravclanPages(config) {
    console.log('  📄 Fetching Travclan pages...');
    
    try {
        // Fetch page 1 first
        console.log('    ↳ Fetching page 1...');
        const page1Response = await fetchTravclanPage(config, 1);
        if (!page1Response.ok) {
            throw new Error(`Travclan API Error: ${page1Response.status}`);
        }

        const page1Data = await page1Response.json();
        let allResults = page1Data.response?.results || [];
        const totalPages = page1Data.totalPages || 1;
        
        console.log(`    ✅ Page 1 loaded: ${allResults.length} results`);
        console.log(`    📄 Total pages to fetch: ${totalPages}`);

        if (totalPages === 1) {
            return { success: true, data: { response: { results: allResults }, totalPages } };
        }

        // Fetch remaining pages in parallel
        console.log(`    ↳ Fetching remaining ${totalPages - 1} pages in parallel...`);
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
            promises.push(
                fetchTravclanPage(config, page)
                    .then(res => {
                        if (res.ok) {
                            console.log(`      ✅ Page ${page} loaded`);
                            return res.json();
                        } else {
                            console.log(`      ❌ Page ${page} failed with status ${res.status}`);
                            return Promise.reject(`Page ${page} failed`);
                        }
                    })
                    .then(data => data.response?.results || [])
                    .catch((err) => {
                        console.log(`      ⚠️ Error on page ${page}: ${err}`);
                        return [];
                    })
            );
        }

        const otherResults = await Promise.all(promises);
        for (const results of otherResults) {
            allResults = allResults.concat(results);
        }
        
        console.log(`    ✅ All pages loaded. Total results: ${allResults.length}`);

        return {
            success: true,
            data: {
                response: { results: allResults },
                totalPages
            }
        };

    } catch (error) {
        console.error(`    ❌ Error fetching Travclan pages: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Fetch single Travclan page
function fetchTravclanPage(config, page) {
    const formattedDate = config.departureDate + 'T00:00:00';
    
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
            preferredDepartureTime: formattedDate,
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

// Process Travclan data
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

// Process Tripjack data
function processTripjackData(data) {
    console.log('🔄 Processing Tripjack data...');
    const processedFlights = [];
    
    if (!data?.payload?.searchResult?.tripInfos?.ONWARD) {
        console.log('❌ No ONWARD trips found in Tripjack response');
        return processedFlights;
    }

    const trips = data.payload.searchResult.tripInfos.ONWARD;
    console.log(`📊 Found ${trips.length} trips in Tripjack response`);

    trips.forEach((trip, tripIndex) => {
        const tripInfo = trip.processedTripInfo;
        if (!tripInfo) {
            console.log(`    ⚠️ Trip ${tripIndex + 1} has no processedTripInfo`);
            return;
        }

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
            trip.totalPriceList.forEach((priceOption, priceIndex) => {
                const adultFare = priceOption.fd?.ADULT;
                if (!adultFare) {
                    return;
                }

                const matchingPriceInfo = tripInfo.pI?.find(p => p.id === priceOption.id);

                const flightData = {
                    portal: 'Tripjack',
                    airline: airline,
                    flightNumber: flightNumbers.join(', '),
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
                    tds: matchingPriceInfo?.tds || 0,
                    fareClass: priceOption.fareIdentifier || matchingPriceInfo?.ft || '',
                    fareType: matchingPriceInfo?.ft || '',
                    provider: providers.join(', '),
                    baggage: adultFare.bI?.iB || 'N/A',
                    cabinBaggage: adultFare.bI?.cB || 'N/A'
                };

                processedFlights.push(flightData);
            });
        }
    });

    console.log(`✅ Successfully processed ${processedFlights.length} Tripjack flights`);
    return processedFlights;
}

// Display results
function displayResults(travclanResult, tripjackResult, tboResult, showTravclan, showTripjack, showTBO) {
    const allFlights = [];
    
    if (showTravclan && travclanResult.flights) {
        allFlights.push(...travclanResult.flights);
    }
    
    if (showTripjack && tripjackResult.flights) {
        allFlights.push(...tripjackResult.flights);
    }

    if (showTBO && tboResult.flights) {
        allFlights.push(...tboResult.flights);
    }

    // Sort by price
    allFlights.sort((a, b) => (a.finalFare || a.farePrice) - (b.finalFare || b.farePrice));

    // Display stats
    const travclanCount = travclanResult.flights?.length || 0;
    const tripjackCount = tripjackResult.flights?.length || 0;
    const tboCount = tboResult.flights?.length || 0;
    const lowestFare = allFlights.length > 0 ? 
        Math.min(...allFlights.map(f => f.finalFare || f.farePrice)) : 0;

    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${allFlights.length}</div>
            <div class="stat-label">Total Flights</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${travclanCount}</div>
            <div class="stat-label">Travclan Flights</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${tripjackCount}</div>
            <div class="stat-label">Tripjack Flights</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${tboCount}</div>
            <div class="stat-label">TBO Flights</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">₹${lowestFare.toLocaleString()}</div>
            <div class="stat-label">Lowest Fare</div>
        </div>
    `;

    // Display flights (limit to 50)
    flightGrid.innerHTML = allFlights.slice(0, 50).map(flight => {
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
    }).join('');

    resultsSection.classList.add('active');
}

// Export to CSV
function exportToCSV(portal) {
    const flightData = portal === 'travclan' ? travclanFlightData : 
                     portal === 'tripjack' ? tripjackFlightData : 
                     tboFlightData;
    
    if (!flightData || flightData.length === 0) {
        showError(`No ${portal} data to export!`);
        return;
    }

    console.log(`📥 Exporting ${portal} CSV with ${flightData.length} flights...`);

    let headers, csvContent;
    
    if (portal === 'travclan') {
        headers = [
            'Portal', 'Flight Number', 'Airline', 'Origin', 'Destination',
            'Departure Time', 'Arrival Time', 'Duration', 'Stops',
            'Base Fare', 'Final Fare', 'Fare Class', 'Fare Type',
            'Provider', 'Baggage', 'Cabin Baggage'
        ];

        csvContent = [
            headers.join(','),
            ...flightData.map(flight => [
                flight.portal,
                flight.flightNumber,
                `"${flight.airline}"`,
                flight.origin,
                flight.destination,
                `"${flight.departureTime}"`,
                `"${flight.arrivalTime}"`,
                flight.duration,
                flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`,
                flight.baseFare,
                flight.finalFare,
                `"${flight.fareClass}"`,
                `"${flight.fareIdentifier}"`,
                `"${flight.provider}"`,
                `"${flight.baggage}"`,
                `"${flight.cabinBaggage}"`
            ].join(','))
        ].join('\n');
    } else if (portal === 'tripjack') {
        headers = [
            'Portal', 'Flight Number', 'Airline', 'Origin', 'Destination',
            'Departure Time', 'Arrival Time', 'Duration', 'Direct/Indirect',
            'Base Fare', 'Final Fare', 'Net-TDS', 'Fare Type',
            'Provider', 'Baggage', 'Cabin Baggage'
        ];

        csvContent = [
            headers.join(','),
            ...flightData.map(flight => [
                flight.portal,
                `"${flight.flightNumber}"`,
                `"${flight.airline}"`,
                flight.origin,
                flight.destination,
                `"${flight.departureTime}"`,
                `"${flight.arrivalTime}"`,
                flight.duration,
                flight.directIndirect,
                flight.baseFare,
                flight.finalFare,
                flight.netMinusTds.toFixed(2),
                `"${flight.fareType}"`,
                `"${flight.provider}"`,
                `"${flight.baggage}"`,
                `"${flight.cabinBaggage}"`
            ].join(','))
        ].join('\n');
    } else {
        // TBO CSV format
        headers = [
            'Portal', 'Flight Number', 'Airline', 'Origin', 'Destination',
            'Departure Time', 'Arrival Time', 'Duration', 'Direct/Indirect',
            'Base Fare', 'Final Fare', 'Fare Type', 'Provider',
            'Baggage', 'Cabin Baggage'
        ];

        csvContent = [
            headers.join(','),
            ...flightData.map(flight => [
                flight.portal,
                `"${flight.flightNumber}"`,
                `"${flight.airline}"`,
                flight.origin,
                flight.destination,
                `"${flight.departureTime}"`,
                `"${flight.arrivalTime}"`,
                flight.duration,
                flight.directIndirect || (flight.stops === 0 || flight.stops === 'Non-Stop' ? 'Direct' : 'Indirect'),
                flight.baseFare,
                flight.finalFare,
                `"${flight.fareType}"`,
                `"${flight.provider}"`,
                `"${flight.baggage}"`,
                `"${flight.cabinBaggage}"`
            ].join(','))
        ].join('\n');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const source = document.getElementById('source').value.toUpperCase();
    const destination = document.getElementById('destination').value.toUpperCase();
    const filename = `${portal}_flights_${source}_${destination}_${timestamp}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log(`✅ CSV exported successfully: ${filename}`);
}

// Helper functions
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

function formatDate(dateTimeStr) {
    if (!dateTimeStr) return '';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateTimeStr;
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

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}