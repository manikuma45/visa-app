document.addEventListener('DOMContentLoaded', () => {
    const visaTypeSelect = document.getElementById('visaType');
    const appTypeGroup = document.getElementById('appTypeGroup');
    const appTypeSelect = document.getElementById('appType');
    
    // Populate the dropdown dynamically from data.js
    if (typeof visaData !== 'undefined') {
        for (const [id, info] of Object.entries(visaData)) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${info.name_en} (${info.name_ja})`;
            visaTypeSelect.appendChild(option);
        }
    } else {
        console.error("visaData is not loaded. Please ensure data.js is included.");
    }

    // Hide app type selection if not needed (e.g. Permanent Resident or identical requirements)
    visaTypeSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId && visaData[selectedId]) {
            const reqs = visaData[selectedId].requirements;
            if (!reqs) return;
            
            // Check if coe, change, extension are identical
            const isSame = JSON.stringify(reqs.coe || []) === JSON.stringify(reqs.change || []) && 
                           JSON.stringify(reqs.change || []) === JSON.stringify(reqs.extension || []);
                           
            if (isSame || selectedId === '60') {
                appTypeGroup.style.display = 'none';
                appTypeSelect.value = 'change'; // default fallback
            } else {
                appTypeGroup.style.display = 'flex';
            }
        } else {
            appTypeGroup.style.display = 'flex';
        }
    });
});

document.getElementById('checkBtn').addEventListener('click', () => {
    const visaType = document.getElementById('visaType').value;
    const appType = document.getElementById('appType').value;
    
    if (!visaType || !appType) {
        alert("Please select both Visa Type and Application Type.");
        return;
    }

    // Read data locally from visaData
    const visaInfo = visaData[visaType];
    
    if (!visaInfo || !visaInfo.requirements || !visaInfo.requirements[appType]) {
        alert("Data not found for this selection.");
        return;
    }

    const resultsArea = document.getElementById('resultsArea');
    const basicDocList = document.getElementById('basicDocList');
    const resultTitle = document.getElementById('resultTitle');
    
    // Clear previous results
    basicDocList.innerHTML = '<li>Loading...</li>';
    resultsArea.style.display = 'block';

    try {
        // Read data locally from visaData instead of fetching from API
        const visaInfo = visaData[visaType];
        
        if (!visaInfo || !visaInfo.requirements || !visaInfo.requirements[appType]) {
            throw new Error("Data not found for this selection.");
        }
        
        // Set Bilingual Title
        resultTitle.innerHTML = `✅ Documents for ${visaInfo.name_en} <br><small>(${visaInfo.name_ja})</small>`;
        
        const documents = visaInfo.requirements[appType];
        
        basicDocList.innerHTML = '';
        
        if (documents.length === 0) {
            basicDocList.innerHTML = '<li>No basic documents found for this selection. Please consult directly.</li>';
            return;
        }

        documents.forEach(docName => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${docName}</strong>`;
            basicDocList.appendChild(li);
        });

    } catch (error) {
        console.error('Error reading data:', error);
        basicDocList.innerHTML = '<li style="color:red;">Error retrieving data.</li>';
    }
});
