let currentLang = 'en'; // default language

document.addEventListener('DOMContentLoaded', () => {
    const visaTypeSelect = document.getElementById('visaType');
    const appTypeGroup = document.getElementById('appTypeGroup');
    const appTypeSelect = document.getElementById('appType');
    const langToggle = document.getElementById('langToggle');
    const nationalitySelect = document.getElementById('nationality');
    const currentLocationSelect = document.getElementById('currentLocation');

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

        // Update visa dropdown options safely for all browsers
        const currentVisaVal = visaTypeSelect.value;
        while(visaTypeSelect.firstChild) {
            visaTypeSelect.removeChild(visaTypeSelect.firstChild);
        }
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.textContent = `-- ${currentLang === 'en' ? 'Select Visa Type' : 'ビザの種類を選択'} --`;
        visaTypeSelect.appendChild(defaultOpt);

        if (typeof visaData !== 'undefined') {
            for (const [id, info] of Object.entries(visaData)) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = currentLang === 'en' ? info.name_en : info.name_ja;
                visaTypeSelect.appendChild(option);
            }
        }
        visaTypeSelect.value = currentVisaVal;

        // Update application type options safely for all browsers
        const currentAppVal = appTypeSelect.value || 'coe';
        while(appTypeSelect.firstChild) {
            appTypeSelect.removeChild(appTypeSelect.firstChild);
        }
        
        const appOpts = [
            { value: 'coe', text: currentLang === 'en' ? 'Certificate of Eligibility (New)' : '在留資格認定証明書交付申請 (新規)' },
            { value: 'change', text: currentLang === 'en' ? 'Change of Visa Status' : '在留資格変更許可申請' },
            { value: 'extension', text: currentLang === 'en' ? 'Extension of Period of Stay' : '在留期間更新許可申請' }
        ];

        appOpts.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = o.text;
            appTypeSelect.appendChild(opt);
        });

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

    // Auto-select COE if outside Japan
    if (currentLocationSelect) {
        currentLocationSelect.addEventListener('change', (e) => {
            if (e.target.value === 'outside_japan') {
                appTypeSelect.value = 'coe';
                appTypeGroup.style.display = 'none';
            } else {
                appTypeGroup.style.display = 'flex';
            }
        });
    }

    // Check Button Logic
    document.getElementById('checkBtn').addEventListener('click', renderResults);

    function renderResults() {
        const visaType = visaTypeSelect.value;
        const appType = appTypeSelect.value;
        const nationality = nationalitySelect ? nationalitySelect.value : '';
        const currentLocation = currentLocationSelect ? currentLocationSelect.value : '';
        
        if (!nationality || !currentLocation || !visaType || !appType) {
            alert(currentLang === 'en' ? "Please select Nationality, Location, Visa Type, and Application Type." : "国籍、居住地、ビザの種類、申請の種類をすべて選択してください。");
            return;
        }

        // Track event in GA4
        if (typeof gtag === 'function') {
            gtag('event', 'visa_check', {
                'nationality': nationality,
                'location': currentLocation,
                'visa_type': visaType,
                'app_type': appType
            });
        }

        // Calculate Risk Score
        let yesCount = 0;
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');
        const q3 = document.querySelector('input[name="q3"]:checked');
        if (q1 && q1.value === 'yes') yesCount++;
        if (q2 && q2.value === 'yes') yesCount++;
        if (q3 && q3.value === 'yes') yesCount++;

        const riskWarningBox = document.getElementById('riskWarningBox');
        const riskMessage = document.getElementById('riskMessage');
        
        if (riskWarningBox && riskMessage) {
            riskWarningBox.style.display = 'block';
            if (yesCount === 0) {
                riskWarningBox.style.borderColor = '#1dd1a1';
                riskWarningBox.querySelector('h3').style.color = '#1dd1a1';
                riskMessage.innerHTML = currentLang === 'en' ? 
                    "✅ No critical risks detected. However, immigration screening is getting stricter. Even minor document flaws can cause delays or rejection. Consult a professional to ensure success." : 
                    "✅ 致命的なリスクはありません。ただし、入管の審査は年々厳しくなっており、少しの書類不備でも遅延や不許可に繋がります。確実を期すならプロにお任せください。";
            } else if (yesCount === 1) {
                riskWarningBox.style.borderColor = '#ff9f43';
                riskWarningBox.querySelector('h3').style.color = '#ff9f43';
                riskMessage.innerHTML = currentLang === 'en' ? 
                    "⚠️ [High Risk] Your past record will be strictly scrutinized. Submitting basic documents alone will likely lead to rejection. Consult an expert immediately to cover these risks." : 
                    "⚠️ 【高リスク】入管はあなたの過去の履歴（未納や違反など）を厳しく審査します。ネットにある基本書類だけを出しても、マイナス点をカバーできずに不許可になる可能性が非常に高いです。今すぐプロの行政書士にご相談ください。";
            } else {
                riskWarningBox.style.borderColor = '#ff4757';
                riskWarningBox.querySelector('h3').style.color = '#ff4757';
                riskMessage.innerHTML = currentLang === 'en' ? 
                    "🚨 [Critical Danger] High risk of rejection and potential return to your home country if you apply by yourself. DO NOT apply alone. You need emergency professional intervention." : 
                    "🚨 【危険】自分で申請した場合、不許可になり母国へ帰国しなければならないリスクが極めて高い状態です。絶対に自分で申請しないでください。あなたの状況を正確に分析し、正しい手続きを行うために、今すぐ専門家による緊急対応が必要です。";
            }
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

    // Secure Phone Number Obfuscation to prevent scraping
    const secureCallBtn = document.getElementById('secureCallBtn');
    if (secureCallBtn) {
        secureCallBtn.addEventListener('click', () => {
            // "0426452901"
            const p1 = '042';
            const p2 = '645';
            const p3 = '2901';
            window.location.href = `tel:${p1}${p2}${p3}`;
        });
    }

    // Secure WhatsApp Link Obfuscation to prevent scraping
    const waBtns = document.querySelectorAll('.secure-wa-btn');
    waBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Track conversion in GA4
            if (typeof gtag === 'function') {
                gtag('event', 'whatsapp_click', {
                    'event_category': 'conversion',
                    'event_label': 'whatsapp_contact'
                });
            }
            const w1 = '8190';
            const w2 = '5395';
            const w3 = '5657';
            window.open(`https://wa.me/${w1}${w2}${w3}`, '_blank', 'noopener,noreferrer');
        });
    });
});
