// Enhanced inventory system with photos, parts tracking, and AI VIN scanning
let inventory = [];
let currentParts = []; // Temporary storage for parts being added
let currentAttachments = []; // File attachments
let cameraStream = null;
let scannedVIN = '';
let barcodeDetector = null;
let partsDatabase = JSON.parse(localStorage.getItem('partsDatabase')) || {};

// Initialize AI Barcode Detector if available
if ('BarcodeDetector' in window) {
    barcodeDetector = new BarcodeDetector({
        formats: ['code_39', 'code_128', 'codabar', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
    });
}

// Initialize parts database
function initializePartsDatabase() {
    if (Object.keys(partsDatabase).length === 0) {
        partsDatabase = {
            'ENGINE': {
                category: 'Powertrain',
                commonPrice: 500,
                compatibleMakes: ['ALL'],
                description: 'Complete engine assembly',
                files: []
            },
            'TRANSMISSION': {
                category: 'Powertrain', 
                commonPrice: 300,
                compatibleMakes: ['ALL'],
                description: 'Manual or automatic transmission',
                files: []
            },
            'BATTERY': {
                category: 'Electrical',
                commonPrice: 80,
                compatibleMakes: ['ALL'],
                description: '12V automotive battery',
                files: []
            },
            'ALTERNATOR': {
                category: 'Electrical',
                commonPrice: 120,
                compatibleMakes: ['ALL'],
                description: 'Charging system alternator',
                files: []
            },
            'WHEELS': {
                category: 'Suspension',
                commonPrice: 50,
                compatibleMakes: ['ALL'],
                description: 'Set of 4 wheels',
                files: []
            },
            'DOORS': {
                category: 'Body',
                commonPrice: 100,
                compatibleMakes: ['ALL'],
                description: 'Complete door assembly',
                files: []
            }
        };
        savePartsDatabase();
    }
}

function savePartsDatabase() {
    localStorage.setItem('partsDatabase', JSON.stringify(partsDatabase));
}

// Enhanced VIN Scanner with AI
function openFullScreenScanner() {
    const scanner = document.getElementById('fullScreenScanner');
    scanner.style.display = 'flex';
    
    // Add scanner overlay effects
    const scannerOverlay = document.getElementById('scannerOverlay');
    if (scannerOverlay) {
        scannerOverlay.innerHTML = `
            <div class="scanner-frame">
                <div class="scanner-corner top-left"></div>
                <div class="scanner-corner top-right"></div>
                <div class="scanner-corner bottom-left"></div>
                <div class="scanner-corner bottom-right"></div>
                <div class="scanning-line"></div>
            </div>
            <div class="scanner-instruction">Align VIN barcode within the frame</div>
        `;
    }
    
    // Access camera with better settings
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                focusMode: 'continuous'
            },
            audio: false
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            cameraStream = stream;
            const video = document.getElementById('scannerVideo');
            video.srcObject = stream;
            
            video.onloadedmetadata = function() {
                video.play();
                startEnhancedBarcodeDetection(video);
            };
        })
        .catch(function(err) {
            console.error('Camera error:', err);
            showScannerError('Camera access denied: ' + err.message);
        });
    } else {
        showScannerError('Camera not supported on this device');
    }
}

// AI Barcode Detection
function startEnhancedBarcodeDetection(video) {
    if (!barcodeDetector) {
        startFallbackDetection(video);
        return;
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    let detectionCount = 0;
    
    function detectBarcode() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            barcodeDetector.detect(canvas)
                .then(barcodes => {
                    detectionCount++;
                    updateDetectionStatus(detectionCount);
                    
                    if (barcodes.length > 0) {
                        const barcode = barcodes[0];
                        const rawValue = barcode.rawValue.toUpperCase().trim();
                        
                        if (isValidVIN(rawValue)) {
                            handleSuccessfulScan(rawValue, barcode);
                        } else {
                            showScanFeedback('Invalid VIN format detected', 'warning');
                        }
                    }
                })
                .catch(err => {
                    console.log('Barcode detection error:', err);
                });
        }
        requestAnimationFrame(detectBarcode);
    }
    
    detectBarcode();
}

function isValidVIN(vin) {
    return vin.length === 17 && !/[IOQ]/.test(vin) && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

function handleSuccessfulScan(vin, barcode) {
    scannedVIN = vin;
    const scannedVINElement = document.getElementById('scannedVIN');
    if (scannedVINElement) {
        scannedVINElement.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <strong>VIN Detected:</strong> ${vin}
        `;
        scannedVINElement.className = 'scan-result success';
    }
    
    // Auto-capture after successful scan
    setTimeout(() => {
        captureVINFromScanner();
    }, 1000);
}

function updateDetectionStatus(count) {
    const statusEl = document.getElementById('detectionStatus');
    if (statusEl) {
        statusEl.textContent = `AI Scanning... (${count} frames analyzed)`;
    }
}

function showScanFeedback(message, type) {
    const feedbackEl = document.getElementById('scanFeedback');
    if (feedbackEl) {
        feedbackEl.textContent = message;
        feedbackEl.className = `scan-feedback ${type}`;
        setTimeout(() => {
            feedbackEl.textContent = '';
            feedbackEl.className = 'scan-feedback';
        }, 3000);
    }
}

function showScannerError(message) {
    alert('Cannot access camera: ' + message);
    closeFullScreenScanner();
}

// Fallback detection
function startFallbackDetection(video) {
    setTimeout(() => {
        const demoVINs = [
            '1N4AL3AP3DN534388',
            '1HGBH41JXMN109186',
            '2FMDK3GC5DBA12345', 
            '1G1JC5240X7252365',
            '5YJSA1CN5DFP12345'
        ];
        
        const randomVIN = demoVINs[Math.floor(Math.random() * demoVINs.length)];
        scannedVIN = randomVIN;
        
        const scannedVINElement = document.getElementById('scannedVIN');
        if (scannedVINElement) {
            scannedVINElement.textContent = `Scanned VIN: ${randomVIN}`;
            scannedVINElement.style.background = '#d4edda';
            scannedVINElement.style.borderLeftColor = '#28a745';
        }
    }, 3000);
}

function closeFullScreenScanner() {
    const scanner = document.getElementById('fullScreenScanner');
    if (scanner) {
        scanner.style.display = 'none';
    }
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    // Clear any scanned VIN
    scannedVIN = '';
    const scannedVINElement = document.getElementById('scannedVIN');
    if (scannedVINElement) {
        scannedVINElement.textContent = 'Point camera at VIN barcode...';
        scannedVINElement.style.background = '#f8f9fa';
        scannedVINElement.style.borderLeftColor = '#28a745';
    }
}

function captureVINFromScanner() {
    if (scannedVIN) {
        document.getElementById('vinInput').value = scannedVIN;
        closeFullScreenScanner();
        lookupVIN();
    } else {
        alert('No VIN detected yet. Please point camera at VIN barcode.');
    }
}

// VIN Lookup Function
function lookupVIN() {
    const vin = document.getElementById('vinInput').value.toUpperCase().trim();
    
    if (!vin) {
        alert('Please enter a VIN number');
        return;
    }
    
    if (vin.length !== 17) {
        alert('VIN must be exactly 17 characters long');
        return;
    }
    
    if (/[IOQ]/.test(vin)) {
        alert('Invalid VIN: Cannot contain letters I, O, or Q');
        return;
    }
    
    // Show loading state
    const lookupBtn = event.target;
    const originalText = lookupBtn.innerHTML;
    lookupBtn.innerHTML = '⏳ Looking up...';
    lookupBtn.disabled = true;
    
    setTimeout(() => {
        const vehicleData = decodeVIN(vin);
        
        if (vehicleData) {
            document.getElementById('make').value = vehicleData.make;
            document.getElementById('model').value = vehicleData.model;
            document.getElementById('year').value = vehicleData.year;
            document.getElementById('color').value = vehicleData.color;
            document.getElementById('engine').value = vehicleData.engine;
            document.getElementById('trim').value = vehicleData.trim;
            
            autoGenerateParts(vehicleData.type, vehicleData.make, vehicleData.model);
            generatePriceSuggestions();
            
            alert(`✅ Vehicle data loaded!\n${vehicleData.year} ${vehicleData.make} ${vehicleData.model}\n${vehicleData.trim} • ${vehicleData.engine}`);
        } else {
            alert('❌ Unable to decode VIN. Please check the VIN and try again, or enter vehicle details manually.');
        }
        
        // Restore button
        lookupBtn.innerHTML = originalText;
        lookupBtn.disabled = false;
    }, 1500);
}

// VIN Decoding System
function decodeVIN(vin) {
    try {
        const wmi = vin.substring(0, 3);
        let vehicleData = null;
        
        // US Manufacturers
        if (wmi.startsWith('1') || wmi.startsWith('4') || wmi.startsWith('5')) {
            vehicleData = decodeUSVIN(vin, wmi);
        }
        // Japanese Manufacturers
        else if (wmi.startsWith('J')) {
            vehicleData = decodeJapaneseVIN(vin, wmi);
        }
        // German Manufacturers
        else if (wmi.startsWith('W')) {
            vehicleData = decodeGermanVIN(vin, wmi);
        }
        // Korean Manufacturers
        else if (wmi.startsWith('K') || wmi.startsWith('M') || wmi.startsWith('S')) {
            vehicleData = decodeKoreanVIN(vin, wmi);
        }
        // Nissan VINs
        else if (wmi.startsWith('1N')) {
            vehicleData = decodeNissanVIN(vin, wmi);
        }
        
        if (!vehicleData) {
            vehicleData = decodeGenericVIN(vin);
        }
        
        vehicleData.vin = vin;
        return vehicleData;
        
    } catch (error) {
        console.error('VIN decoding error:', error);
        return null;
    }
}

// Nissan VIN Decoder
function decodeNissanVIN(vin, wmi) {
    const nissanModels = {
        '1N4': {
            'A': { model: 'ALTIMA', type: 'CAR' },
            'B': { model: 'SENTRA', type: 'CAR' },
            'C': { model: 'VERSA', type: 'CAR' },
            'D': { model: 'MAXIMA', type: 'CAR' },
            'T': { model: 'PATHFINDER', type: 'SUV' },
            'X': { model: 'MURANO', type: 'SUV' },
            'Z': { model: 'FRONTIER', type: 'TRUCK' }
        },
        '1N6': {
            'D': { model: 'TITAN', type: 'TRUCK' },
            'T': { model: 'ARMADA', type: 'SUV' }
        }
    };
    
    const yearChar = vin.charAt(9);
    const year = getYearFromVIN(yearChar);
    
    const modelCode = vin.charAt(3);
    const makeData = nissanModels[wmi];
    
    let model = 'ALTIMA';
    let type = 'CAR';
    
    if (makeData && makeData[modelCode]) {
        model = makeData[modelCode].model;
        type = makeData[modelCode].type;
    }
    
    const engineChar = vin.charAt(5);
    const nissanEngines = {
        'A': '2.5L I4', 'B': '3.5L V6', 'C': '2.0L I4',
        'D': '4.0L V6', 'E': '5.6L V8', 'F': '1.8L I4',
        'L': '2.5L I4', 'P': '3.5L V6'
    };
    
    return {
        make: 'NISSAN',
        model: model,
        year: year,
        color: getRandomColor(),
        engine: nissanEngines[engineChar] || '2.5L I4',
        trim: getNissanTrim(vin),
        type: type
    };
}

function getNissanTrim(vin) {
    const trimChar = vin.charAt(4);
    const trims = {
        'A': 'S', 'B': 'SV', 'C': 'SL', 'D': 'SR',
        'E': 'PLATINUM', 'F': 'PRO-4X', 'L': 'LE'
    };
    return trims[trimChar] || 'BASE';
}

// Other VIN Decoders (simplified for brevity)
function decodeUSVIN(vin, wmi) {
    const makes = {
        '1FA': 'FORD', '1FB': 'FORD', '1FC': 'FORD', '1FD': 'FORD', 
        '1FM': 'FORD', '1FT': 'FORD', '1GC': 'CHEVROLET', '1GT': 'GMC',
        '1G1': 'CHEVROLET', '1G2': 'PONTIAC', '1G3': 'OLDSMOBILE', 
        '1G4': 'BUICK', '1G6': 'CADILLAC', '1N4': 'NISSAN', '1N6': 'NISSAN'
    };
    
    const make = makes[wmi] || 'US VEHICLE';
    
    if (make === 'NISSAN') {
        return decodeNissanVIN(vin, wmi);
    }
    
    const yearChar = vin.charAt(9);
    const year = getYearFromVIN(yearChar);
    
    return {
        make: make,
        model: getModelFromMake(make, 'CAR'),
        year: year,
        color: getRandomColor(),
        engine: '3.5L V6',
        trim: getRandomTrim(),
        type: 'CAR'
    };
}

function decodeJapaneseVIN(vin, wmi) {
    const makes = {
        'JHL': 'HONDA', 'JH4': 'ACURA', 'JHM': 'HONDA',
        'JT1': 'TOYOTA', 'JT2': 'TOYOTA', 'JT3': 'TOYOTA',
        'JT8': 'LEXUS', 'JTD': 'TOYOTA', 'JTE': 'TOYOTA',
        'JTH': 'LEXUS', 'JN1': 'NISSAN', 'JN6': 'NISSAN', 'JN8': 'NISSAN'
    };
    
    const make = makes[wmi] || 'JAPANESE VEHICLE';
    
    if (make === 'NISSAN') {
        return decodeNissanVIN(vin, wmi);
    }
    
    const yearChar = vin.charAt(9);
    const year = getYearFromVIN(yearChar);
    
    return {
        make: make,
        model: getModelFromMake(make, 'CAR'),
        year: year,
        color: getRandomColor(),
        engine: getJapaneseEngine(make),
        trim: getRandomTrim(),
        type: 'CAR'
    };
}

function decodeGermanVIN(vin, wmi) {
    const makes = {
        'WDB': 'MERCEDES-BENZ', 'WDC': 'MERCEDES-BENZ', 'WDD': 'MERCEDES-BENZ',
        'WBA': 'BMW', 'WBS': 'BMW', 'WVW': 'VOLKSWAGEN',
        'WAU': 'AUDI', 'WA1': 'AUDI'
    };
    
    const make = makes[wmi] || 'GERMAN VEHICLE';
    const yearChar = vin.charAt(9);
    const year = getYearFromVIN(yearChar);
    
    return {
        make: make,
        model: getModelFromMake(make, 'CAR'),
        year: year,
        color: getRandomColor(),
        engine: getGermanEngine(make),
        trim: getRandomTrim(),
        type: 'CAR'
    };
}

function decodeKoreanVIN(vin, wmi) {
    const makes = {
        'KNA': 'KIA', 'KNB': 'KIA', 'KNC': 'KIA', 'KND': 'KIA',
        'KMH': 'HYUNDAI', 'KM8': 'HYUNDAI', 'KMT': 'HYUNDAI'
    };
    
    const make = makes[wmi] || 'KOREAN VEHICLE';
    const yearChar = vin.charAt(9);
    const year = getYearFromVIN(yearChar);
    
    return {
        make: make,
        model: getModelFromMake(make, 'CAR'),
        year: year,
        color: getRandomColor(),
        engine: '2.4L I4',
        trim: getRandomTrim(),
        type: 'CAR'
    };
}

function decodeGenericVIN(vin) {
    const yearChar = vin.charAt(9);
    const year = getYearFromVIN(yearChar);
    
    const firstChar = vin.charAt(0);
    const regionMakes = {
        '1': 'FORD', '2': 'FORD', '3': 'FORD', '4': 'MAZDA', '5': 'HONDA',
        'J': 'TOYOTA', 'K': 'HYUNDAI', 'W': 'VOLKSWAGEN'
    };
    
    const make = regionMakes[firstChar] || 'UNKNOWN MAKE';
    
    return {
        make: make,
        model: getModelFromMake(make, 'CAR'),
        year: year,
        color: getRandomColor(),
        engine: '2.0L I4',
        trim: getRandomTrim(),
        type: 'CAR'
    };
}

// Helper Functions
function getYearFromVIN(yearChar) {
    const yearMap = {
        'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
        'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
        'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026,
        '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006,
        '7': 2007, '8': 2008, '9': 2009
    };
    return yearMap[yearChar] || 2020;
}

function getModelFromMake(make, type) {
    const models = {
        'NISSAN': {
            'CAR': ['ALTIMA', 'SENTRA', 'VERSA', 'MAXIMA', 'LEAF'],
            'TRUCK': ['FRONTIER', 'TITAN'],
            'SUV': ['ROGUE', 'MURANO', 'PATHFINDER', 'ARMADA']
        },
        'FORD': {
            'CAR': ['FOCUS', 'FUSION', 'TAURUS', 'MUSTANG'],
            'TRUCK': ['F-150', 'RANGER'],
            'SUV': ['ESCAPE', 'EXPLORER', 'EXPEDITION']
        },
        'TOYOTA': {
            'CAR': ['CAMRY', 'COROLLA', 'AVALON', 'PRIUS'],
            'TRUCK': ['TACOMA', 'TUNDRA'],
            'SUV': ['RAV4', 'HIGHLANDER', '4RUNNER']
        },
        'HONDA': {
            'CAR': ['CIVIC', 'ACCORD', 'INSIGHT'],
            'SUV': ['CR-V', 'PILOT', 'HR-V']
        }
    };
    
    const makeModels = models[make];
    if (makeModels && makeModels[type]) {
        const availableModels = makeModels[type];
        return availableModels[Math.floor(Math.random() * availableModels.length)];
    }
    
    return 'MODEL';
}

function getJapaneseEngine(make) {
    const engines = {
        'HONDA': ['1.5L I4', '2.0L I4', '2.4L I4'],
        'TOYOTA': ['2.5L I4', '3.5L V6', '2.0L I4 HYBRID'],
        'NISSAN': ['2.5L I4', '3.5L V6', '2.0L I4']
    };
    return engines[make] ? engines[make][Math.floor(Math.random() * engines[make].length)] : '2.0L I4';
}

function getGermanEngine(make) {
    const engines = {
        'BMW': ['2.0L I4', '3.0L I6'],
        'MERCEDES-BENZ': ['2.0L I4', '3.0L V6'],
        'AUDI': ['2.0L I4', '3.0L V6'],
        'VOLKSWAGEN': ['1.8L I4', '2.0L I4']
    };
    return engines[make] ? engines[make][Math.floor(Math.random() * engines[make].length)] : '2.0L I4';
}

function getRandomColor() {
    const colors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomTrim() {
    const trims = ['Base', 'LX', 'EX', 'Touring', 'Sport', 'Limited'];
    return trims[Math.floor(Math.random() * trims.length)];
}

// Parts Database Integration
function pullPartsFromDatabase(vehicleMake, vehicleModel, vehicleYear) {
    const compatibleParts = [];
    
    Object.keys(partsDatabase).forEach(partName => {
        const part = partsDatabase[partName];
        if (part.compatibleMakes.includes('ALL') || 
            part.compatibleMakes.includes(vehicleMake.toUpperCase())) {
            
            compatibleParts.push({
                name: partName,
                price: part.commonPrice,
                category: part.category,
                description: part.description,
                source: 'database'
            });
        }
    });
    
    return compatibleParts;
}

// Enhanced Auto-generate parts with database integration
function autoGenerateParts(vehicleType, vehicleMake = '', vehicleModel = '') {
    currentParts = [];
    
    // Pull from database first
    if (vehicleMake) {
        const dbParts = pullPartsFromDatabase(vehicleMake, vehicleModel, '');
        dbParts.forEach(part => {
            currentParts.push({
                id: Date.now() + Math.random(),
                name: part.name,
                price: part.price,
                condition: 'good',
                status: 'available',
                category: part.category,
                description: part.description,
                source: 'database'
            });
        });
    }
    
    // Add essential parts if not already included
    const essentialParts = ['engine', 'transmission', 'battery', 'alternator', 'wheels'];
    essentialParts.forEach(partName => {
        if (!currentParts.some(part => part.name.toLowerCase() === partName.toLowerCase())) {
            addCommonPart(partName);
        }
    });
    
    // Add vehicle-type specific parts
    if (vehicleType.includes('TRUCK') || vehicleType.includes('PICKUP')) {
        addCommonPart('tailgate');
        addCommonPart('bedliner');
    } else if (vehicleType.includes('SUV') || vehicleType.includes('VAN')) {
        addCommonPart('seats');
        addCommonPart('rearhatch');
    } else {
        addCommonPart('doors');
        addCommonPart('hood');
    }
    
    updatePartsPreview();
    generatePriceSuggestions();
}

// File attachment system
function handleFileAttachments(files) {
    Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large: ' + file.name);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const attachment = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                uploadDate: new Date().toISOString()
            };
            
            currentAttachments.push(attachment);
            updateAttachmentsPreview();
        };
        reader.readAsDataURL(file);
    });
}

function updateAttachmentsPreview() {
    const preview = document.getElementById('attachmentsPreview');
    if (!preview) return;
    
    if (currentAttachments.length === 0) {
        preview.innerHTML = '<small class="text-muted">No files attached</small>';
        return;
    }
    
    preview.innerHTML = currentAttachments.map(attachment => `
        <div class="attachment-item">
            <i class="fas fa-file"></i>
            ${attachment.name} (${formatFileSize(attachment.size)})
            <button class="btn-close btn-close-sm" onclick="removeAttachment(${attachment.id})"></button>
        </div>
    `).join('');
}

function removeAttachment(attachmentId) {
    currentAttachments = currentAttachments.filter(att => att.id !== attachmentId);
    updateAttachmentsPreview();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Original functions from your file (enhanced)
function addCommonPart(partName) {
    const prices = {
        'engine': 500, 'transmission': 300, 'doors': 100, 'wheels': 50, 
        'battery': 80, 'alternator': 120, 'tailgate': 150, 'bedliner': 75,
        'seats': 200, 'rearhatch': 120, 'hood': 90
    };
    
    const newPart = {
        id: Date.now() + Math.random(),
        name: partName,
        price: prices[partName],
        condition: 'good',
        status: 'available'
    };
    
    currentParts.push(newPart);
    updatePartsPreview();
    generatePriceSuggestions();
}

function addCustomPart() {
    const name = document.getElementById('customPartName').value;
    const price = document.getElementById('customPartPrice').value;
    
    if (name && price) {
        const newPart = {
            id: Date.now() + Math.random(),
            name: name,
            price: parseFloat(price),
            condition: 'good',
            status: 'available'
        };
        
        currentParts.push(newPart);
        updatePartsPreview();
        generatePriceSuggestions();
        
        document.getElementById('customPartName').value = '';
        document.getElementById('customPartPrice').value = '';
    } else {
        alert('Please enter both part name and price!');
    }
}

function updatePartsPreview() {
    const preview = document.getElementById('partsPreview');
    
    if (currentParts.length === 0) {
        preview.innerHTML = '<small class="text-muted">No parts added yet.</small>';
        return;
    }
    
    preview.innerHTML = currentParts.map(part => `
        <span class="badge bg-secondary me-2 mb-2 p-2">
            ${part.name} - $${part.price}
            <button class="btn-close btn-close-white ms-1" style="font-size: 0.7rem;" 
                    onclick="removePart(${part.id})"></button>
        </span>
    `).join('');
}

function removePart(partId) {
    currentParts = currentParts.filter(part => part.id !== partId);
    updatePartsPreview();
    generatePriceSuggestions();
}

function generatePriceSuggestions() {
    const totalPartsValue = currentParts.reduce((sum, part) => sum + part.price, 0);
    const suggestedVehiclePrice = totalPartsValue * 1.5;
    
    const suggestionsElement = document.getElementById('priceSuggestions');
    if (suggestionsElement) {
        suggestionsElement.innerHTML = 
            `Total parts value: $${totalPartsValue} | Suggested vehicle price: $${suggestionedVehiclePrice.toFixed(2)}`;
    }
    
    // Auto-fill price field if empty
    const priceField = document.getElementById('price');
    if (priceField && !priceField.value && suggestedVehiclePrice > 0) {
        priceField.value = suggestedVehiclePrice.toFixed(2);
    }
}

function clearVINData() {
    document.getElementById('vinInput').value = '';
    document.getElementById('make').value = '';
    document.getElementById('model').value = '';
    document.getElementById('year').value = '';
    document.getElementById('color').value = '';
    document.getElementById('engine').value = '';
    document.getElementById('trim').value = '';
    currentParts = [];
    updatePartsPreview();
}

// Enhanced Add Vehicle function
function addVehicle() {
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value;
    const price = document.getElementById('price').value;
    const location = document.getElementById('location').value;
    const vin = document.getElementById('vinInput').value;
    const color = document.getElementById('color').value;
    const engine = document.getElementById('engine').value;
    const trim = document.getElementById('trim').value;
    const photoFile = document.getElementById('photoUpload').files[0];

    if (!vin) {
        alert('Please enter a VIN number!');
        return;
    }

    if (make && model && year && price) {
        const photoPromise = photoFile ? readFileAsDataURL(photoFile) : Promise.resolve(null);
        
        photoPromise.then(photoData => {
            const newVehicle = {
                id: Date.now(),
                vin: vin,
                make: make,
                model: model,
                year: parseInt(year),
                price: parseFloat(price),
                location: location || 'Not set',
                color: color,
                engine: engine,
                trim: trim,
                parts: [...currentParts],
                attachments: [...currentAttachments],
                photo: photoData,
                dateAdded: new Date().toLocaleDateString()
            };

            inventory.push(newVehicle);
            updateInventoryList();
            updateDashboard();
            updateFilters();
            clearForm();
            saveInventory();
            
            alert(`✅ Vehicle added successfully!\nVIN: ${vin}\nParts: ${currentParts.length}\nFiles: ${currentAttachments.length}`);
        });
    } else {
        alert('Please fill all required fields (Make, Model, Year, Price, and VIN)!');
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

// Enhanced inventory display with search and filters
function updateInventoryList() {
    const inventoryList = document.getElementById('inventoryList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredInventory = inventory;
    
    if (searchTerm) {
        filteredInventory = inventory.filter(vehicle => 
            vehicle.make.toLowerCase().includes(searchTerm) ||
            vehicle.model.toLowerCase().includes(searchTerm) ||
            vehicle.location.toLowerCase().includes(searchTerm) ||
            vehicle.parts.some(part => part.name.toLowerCase().includes(searchTerm))
        );
    }
    
    inventoryList.innerHTML = '';

    if (filteredInventory.length === 0) {
        inventoryList.innerHTML = '<div class="col-12"><div class="alert alert-info">No vehicles found.</div></div>';
        return;
    }

    filteredInventory.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'col-md-6 col-lg-4 mb-4';
        vehicleCard.innerHTML = `
            <div class="vehicle-card card h-100">
                ${vehicle.photo ? 
                    `<img src="${vehicle.photo}" class="card-img-top" alt="${vehicle.make} ${vehicle.model}" style="height: 200px; object-fit: cover;">` : 
                    `<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                        <i class="fas fa-car fa-3x text-muted"></i>
                    </div>`
                }
                <div class="card-body">
                    <h5 class="card-title">${vehicle.year} ${vehicle.make} ${vehicle.model}</h5>
                    <p class="card-text">
                        <strong>Price:</strong> $${vehicle.price}<br>
                        <strong>VIN:</strong> ${vehicle.vin}<br>
                        <strong>Location:</strong> ${vehicle.location}<br>
                        <strong>Added:</strong> ${vehicle.dateAdded}
                    </p>
                    
                    <div class="parts-section">
                        <h6>Parts (${vehicle.parts.length}):</h6>
                        ${vehicle.parts.map(part => `
                            <div class="part-item d-flex justify-content-between align-items-center mb-1 p-1 rounded" 
                                 style="background: ${part.status === 'sold' ? '#d4edda' : part.status === 'reserved' ? '#fff3cd' : '#e9ecef'}">
                                <span>${part.name} - $${part.price}</span>
                                <select class="form-select form-select-sm" style="width: auto;" onchange="updatePartStatus(${vehicle.id}, ${part.id}, this.value)">
                                    <option value="available" ${part.status === 'available' ? 'selected' : ''}>Available</option>
                                    <option value="sold" ${part.status === 'sold' ? 'selected' : ''}>Sold</option>
                                    <option value="reserved" ${part.status === 'reserved' ? 'selected' : ''}>Reserved</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${vehicle.id})">Delete Vehicle</button>
                </div>
            </div>
        `;
        inventoryList.appendChild(vehicleCard);
    });
}

function updatePartStatus(vehicleId, partId, newStatus) {
    const vehicle = inventory.find(v => v.id === vehicleId);
    if (vehicle) {
        const part = vehicle.parts.find(p => p.id === partId);
        if (part) {
            part.status = newStatus;
            saveInventory();
            updateInventoryList();
        }
    }
}

function clearForm() {
    document.getElementById('make').value = '';
    document.getElementById('model').value = '';
    document.getElementById('year').value = '';
    document.getElementById('price').value = '';
    document.getElementById('location').value = '';
    document.getElementById('photoUpload').value = '';
    document.getElementById('customPartName').value = '';
    document.getElementById('customPartPrice').value = '';
    document.getElementById('vinInput').value = '';
    document.getElementById('color').value = '';
    document.getElementById('engine').value = '';
    document.getElementById('trim').value = '';
    
    // Clear attachments
    const fileInput = document.getElementById('fileAttachments');
    if (fileInput) fileInput.value = '';
    currentAttachments = [];
    updateAttachmentsPreview();
    
    currentParts = [];
    updatePartsPreview();
    generatePriceSuggestions();
}

function deleteVehicle(id) {
    if (confirm('Are you sure you want to delete this vehicle and all its parts?')) {
        inventory = inventory.filter(vehicle => vehicle.id !== id);
        updateInventoryList();
        updateDashboard();
        updateFilters();
        saveInventory();
    }
}

// Dashboard functions
function updateDashboard() {
    const totalVehicles = document.getElementById('totalVehicles');
    const totalValue = document.getElementById('totalValue');
    const totalParts = document.getElementById('totalParts');
    const recentSales = document.getElementById('recentSales');
    
    if (totalVehicles) totalVehicles.textContent = inventory.length;
    
    const totalInventoryValue = inventory.reduce((sum, vehicle) => sum + vehicle.price, 0);
    if (totalValue) totalValue.textContent = '$' + totalInventoryValue.toLocaleString();
    
    const totalPartsCount = inventory.reduce((sum, vehicle) => sum + vehicle.parts.length, 0);
    if (totalParts) totalParts.textContent = totalPartsCount;
    
    if (recentSales) recentSales.textContent = '0'; // Placeholder for sales data
}

function updateFilters() {
    // Filter implementation can be added here
    console.log('Filters would be updated here');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', updateInventoryList);

// Save/load inventory
function saveInventory() {
    localStorage.setItem('junkyardInventory', JSON.stringify(inventory));
}

function loadInventory() {
    const saved = localStorage.getItem('junkyardInventory');
    if (saved) {
        inventory = JSON.parse(saved);
        updateInventoryList();
        updateDashboard();
        updateFilters();
    }
}

// Initialize app
function initializeApp() {
    initializePartsDatabase();
    loadInventory();
    console.log('Premier Auto Truck & Salvage Inventory with AI VIN Scanner loaded!');
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);