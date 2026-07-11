let currentLang = 'en'; // default language

document.addEventListener('DOMContentLoaded', () => {
    const visaTypeSelect = document.getElementById('visaType');
    const appTypeGroup = document.getElementById('appTypeGroup');
    const appTypeSelect = document.getElementById('appType');
    const langToggle = document.getElementById('langToggle');

    // Language toggle logic
    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ja' : 'en';
        updateUILanguage();
    });

    function updateUILanguage() {
        // Update static text elements
        const langElements = document.querySelectorAll('.lang-text');
        langElements.forEach(el => {
            if (currentLang === 'en' && el.dataset.en) {
                el.textContent = el.dataset.en;
            } else if (currentLang === 'ja' && el.dataset.ja) {
                el.textContent = el.dataset.ja;
            }
        });

        // Update visa dropdown options
        const currentVisaVal = visaTypeSelect.value;
        visaTypeSelect.innerHTML = `<option value="">-- ${currentLang === 'en' ? 'Select Visa Type' : 'ビザの種類を選択'} --</option>`;
        if (typeof visaData !== 'undefined') {
            for (const [id, info] of Object.entries(visaData)) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = currentLang === 'en' ? info.name_en : info.name_ja;
                visaTypeSelect.appendChild(option);
            }
        }
        visaTypeSelect.value = currentVisaVal;

        // Update application type options
        const currentAppVal = appTypeSelect.value || 'coe';
        appTypeSelect.innerHTML = `
            <option value="coe">${currentLang === 'en' ? 'Certificate of Eligibility (New)' : '在留資格認定証明書交付申請 (新規)'}</option>
            <option value="change">${currentLang === 'en' ? 'Change of Visa Status' : '在留資格変更許可申請'}</option>
            <option value="extension">${currentLang === 'en' ? 'Extension of Period of Stay' : '在留期間更新許可申請'}</option>
        `;
        appTypeSelect.value = currentAppVal;

        // Re-render results if already visible
        const resultsArea = document.getElementById('resultsArea');
        if (resultsArea.style.display === 'block') {
            renderResults();
        }
    }

    // Hide app type selection if not needed
    visaTypeSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId && visaData[selectedId]) {
            const reqs = visaData[selectedId].requirements_ja; // Logic check on JA structure
            if (!reqs) return;
            
            // Check if coe, change, extension are identical
            const isSame = JSON.stringify(reqs.coe || []) === JSON.stringify(reqs.change || []) && 
                           JSON.stringify(reqs.change || []) === JSON.stringify(reqs.extension || []);
                           
            if (isSame) {
                appTypeGroup.style.display = 'none';
                appTypeSelect.value = 'change'; // default fallback
            } else {
                appTypeGroup.style.display = 'flex';
            }
        } else {
            appTypeGroup.style.display = 'flex';
        }
    });

    // Check Button Logic
    document.getElementById('checkBtn').addEventListener('click', renderResults);

    function renderResults() {
        const visaType = visaTypeSelect.value;
        const appType = appTypeSelect.value;
        
        if (!visaType || !appType) {
            alert(currentLang === 'en' ? "Please select both Visa Type and Application Type." : "ビザの種類と申請の種類を選択してください。");
            return;
        }

        const visaInfo = visaData[visaType];
        
        const resultsArea = document.getElementById('resultsArea');
        const basicDocList = document.getElementById('basicDocList');
        const resultTitle = document.getElementById('resultTitle');
        
        resultsArea.style.display = 'block';

        try {
            // Determine which requirement list to use
            const reqsObj = currentLang === 'en' ? visaInfo.requirements_en : visaInfo.requirements_ja;
            
            if (!reqsObj || !reqsObj[appType]) {
                throw new Error("Data not found for this selection.");
            }
            
            // Set Title
            const titleName = currentLang === 'en' ? visaInfo.name_en : visaInfo.name_ja;
            resultTitle.innerHTML = `✅ ${currentLang === 'en' ? 'Documents for' : ''} ${titleName} ${currentLang === 'ja' ? 'の必要書類' : ''}`;
            
            const documents = reqsObj[appType];
            
            basicDocList.innerHTML = '';
            
            if (documents.length === 0) {
                basicDocList.innerHTML = currentLang === 'en' ? 
                    '<li>No documents found for this selection. Please consult directly.</li>' : 
                    '<li>この申請に関する書類が見つかりません。直接ご相談ください。</li>';
                return;
            }

            documents.forEach(docName => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${docName}</strong>`;
                basicDocList.appendChild(li);
            });

        } catch (error) {
            console.error('Error reading data:', error);
            basicDocList.innerHTML = `<li style="color:red;">${currentLang === 'en' ? 'Error retrieving data.' : 'データの取得に失敗しました。'}</li>`;
        }
    }

    // Initial render
    updateUILanguage();
});
