// Enhanced inventory system with photos and parts tracking
let inventory = [];
let currentParts = []; // Temporary storage for parts being added

// Add common parts with one click
function addCommonPart(partName) {
    const prices = {
        'engine': 500,
        'transmission': 300,
        'doors': 100,
        'wheels': 50,
        'battery': 80,
        'alternator': 120
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
}

// Add custom part
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
        
        // Clear inputs
        document.getElementById('customPartName').value = '';
        document.getElementById('customPartPrice').value = '';
    } else {
        alert('Please enter both part name and price!');
    }
}

// Update parts preview display
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

// Remove part from current selection
function removePart(partId) {
    currentParts = currentParts.filter(part => part.id !== partId);
    updatePartsPreview();
}

// VIN Scanner Functions
let cameraStream = null;

// Start camera for VIN scanning
function startVINScanner() {
    const cameraContainer = document.getElementById('cameraContainer');
    const cameraPreview = document.getElementById('cameraPreview');
    
    // Show camera container
    cameraContainer.style.display = 'block';
    
    // Access device camera
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
    })
    .then(stream => {
        cameraStream = stream;
        cameraPreview.srcObject = stream;
        cameraPreview.play();
    })
    .catch(error => {
        console.error('Camera error:', error);
        alert('Cannot access camera. Please ensure you have given camera permissions.');
        document.getElementById('vinInput').placeholder = 'Enter 17-character VIN manually';
    });
}

// Stop camera
function stopVINScanner() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    document.getElementById('cameraContainer').style.display = 'none';
}

// Capture VIN from camera
function captureVIN() {
    alert('📷 Point camera at VIN barcode and ensure good lighting.\n\nFor now, please manually type the VIN number shown in the barcode.');
    stopVINScanner();
    document.getElementById('vinInput').focus();
}

// Lookup vehicle data from VIN
async function lookupVIN() {
    const vin = document.getElementById('vinInput').value.trim().toUpperCase();
    
    if (!vin) {
        alert('Please enter a VIN number first');
        return;
    }
    
    if (vin.length !== 17) {
        alert('VIN must be 17 characters long');
        return;
    }
    
    // Show loading state
    const lookupBtn = event.target;
    const originalText = lookupBtn.innerHTML;
    lookupBtn.innerHTML = '⏳ Looking up...';
    lookupBtn.disabled = true;
    
    try {
        const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
        const data = await response.json();
        
        if (data.Results) {
            populateVehicleData(data.Results, vin);
        } else {
            throw new Error('No data received');
        }
    } catch (error) {
        console.error('VIN lookup error:', error);
        useMockVINData(vin);
    } finally {
        lookupBtn.innerHTML = originalText;
        lookupBtn.disabled = false;
    }
}

// Populate form with real VIN data
function populateVehicleData(vinData, vin) {
    const findValue = (variable) => {
        const item = vinData.find(item => item.Variable === variable);
        return item ? item.Value : '';
    };
    
    document.getElementById('make').value = findValue('Make') || '';
    document.getElementById('model').value = findValue('Model') || '';
    document.getElementById('year').value = findValue('Model Year') || '';
    document.getElementById('color').value = findValue('Color') || '';
    document.getElementById('engine').value = findValue('Engine Model') || findValue('Engine Number of Cylinders') + ' Cylinder' || '';
    document.getElementById('trim').value = findValue('Trim') || '';
    
    autoGenerateParts(findValue('Vehicle Type'));
    
    alert(`✅ Vehicle data loaded!\n${findValue('Make')} ${findValue('Model')} ${findValue('Model Year')}`);
}

// Fallback mock data for demo purposes
function useMockVINData(vin) {
    const mockMakes = ['FORD', 'CHEVROLET', 'TOYOTA', 'HONDA', 'DODGE'];
    const mockModels = {
        'FORD': ['F-150', 'EXPLORER', 'FOCUS', 'MUSTANG'],
        'CHEVROLET': ['SILVERADO', 'EQUINOX', 'MALIBU', 'CAMARO'],
        'TOYOTA': ['CAMRY', 'COROLLA', 'RAV4', 'TACOMA'],
        'HONDA': ['CIVIC', 'ACCORD', 'CR-V', 'PILOT'],
        'DODGE': ['CHARGER', 'CHALLENGER', 'DURANGO', 'RAM 1500']
    };
    
    const makeIndex = vin.charCodeAt(0) % mockMakes.length;
    const make = mockMakes[makeIndex];
    const models = mockModels[make];
    const modelIndex = vin.charCodeAt(1) % models.length;
    const model = models[modelIndex];
    const year = 2000 + (vin.charCodeAt(6) % 24);
    
    document.getElementById('make').value = make;
    document.getElementById('model').value = model;
    document.getElementById('year').value = year;
    document.getElementById('color').value = ['Black', 'White', 'Silver', 'Red', 'Blue'][vin.charCodeAt(3) % 5];
    document.getElementById('engine').value = ['V6 3.5L', 'V8 5.0L', 'I4 2.0L', 'V6 3.0L'][vin.charCodeAt(4) % 4];
    document.getElementById('trim').value = ['Base', 'LT', 'Sport', 'Limited'][vin.charCodeAt(5) % 4];
    
    autoGenerateParts('');
    
    alert(`✅ Demo vehicle data loaded!\n${make} ${model} ${year}\n(Using demo data - real API unavailable)`);
}

// Auto-generate common parts based on vehicle type
function autoGenerateParts(vehicleType) {
    currentParts = [];
    
    addCommonPart('engine');
    addCommonPart('transmission');
    addCommonPart('battery');
    addCommonPart('alternator');
    addCommonPart('wheels');
    
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
}

// Clear VIN data
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

// Main function to add vehicle
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
                photo: photoData,
                dateAdded: new Date().toLocaleDateString()
            };

            inventory.push(newVehicle);
            updateInventoryList();
            clearForm();
            saveInventory();
            
            alert(`✅ Vehicle added! ${currentParts.length} parts included.`);
        });
    } else {
        alert('Please fill at least Make, Model, Year, and Price!');
    }
}

// Helper function to read photo files
function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

// Update inventory display
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
        vehicleCard.className = 'col-md-6 col-lg-4';
        vehicleCard.innerHTML = `
            <div class="vehicle-card card h-100">
                <div class="card-body">
                    ${vehicle.photo ? `<img src="${vehicle.photo}" class="vehicle-image img-fluid mb-3" alt="${vehicle.make} ${vehicle.model}">` : ''}
                    <h5 class="card-title">${vehicle.year} ${vehicle.make} ${vehicle.model}</h5>
                    <p class="card-text">
                        <strong>Price:</strong> $${vehicle.price}<br>
                        <strong>Location:</strong> ${vehicle.location}<br>
                        <strong>Added:</strong> ${vehicle.dateAdded}
                    </p>
                    
                    <div class="parts-section">
                        <h6>Parts (${vehicle.parts.length}):</h6>
                        ${vehicle.parts.map(part => `
                            <div class="part-item d-flex justify-content-between align-items-center">
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

// Update part status
function updatePartStatus(vehicleId, partId, newStatus) {
    const vehicle = inventory.find(v => v.id === vehicleId);
    if (vehicle) {
        const part = vehicle.parts.find(p => p.id === partId);
        if (part) {
            part.status = newStatus;
            saveInventory();
            
            const partElement = event.target.closest('.part-item');
            partElement.style.background = newStatus === 'sold' ? '#d4edda' : 
                                         newStatus === 'reserved' ? '#fff3cd' : '#e9ecef';
        }
    }
}

// Clear form after adding vehicle
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
    currentParts = [];
    updatePartsPreview();
}

// Delete vehicle
function deleteVehicle(id) {
    if (confirm('Are you sure you want to delete this vehicle and all its parts?')) {
        inventory = inventory.filter(vehicle => vehicle.id !== id);
        updateInventoryList();
        saveInventory();
    }
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
    }
}

// Initialize app
loadInventory();