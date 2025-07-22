// --- Fetch rocket and planet options on load ---
async function fetchOptions() {
    const rocketRes = await fetch('http://127.0.0.1:8000/rockets');
    const planetRes = await fetch('http://127.0.0.1:8000/planets');
    const rockets = (await rocketRes.json()).rockets;
    const planets = (await planetRes.json()).planets;
    const rocketType = document.getElementById('rocketType');
    const planetSelect = document.getElementById('planet');
    rockets.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.name;
        opt.textContent = r.name;
        rocketType.appendChild(opt);
    });
    planets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.name} (${p.distance_km.toLocaleString()} km)`;
        planetSelect.appendChild(opt);
    });
}
fetchOptions();

// --- Passenger management ---
const passengerList = [];
function renderPassengerList() {
    const ul = document.getElementById('passengerList');
    ul.innerHTML = '';
    passengerList.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>👤 ${p.name} (${p.age}, ${p.country}, ${p.gender}${p.health_issues ? ', Health Issues' : ''})</span> <button onclick="removePassenger(${i})">Remove</button>`;
        ul.appendChild(li);
    });
}
window.removePassenger = function(idx) {
    passengerList.splice(idx, 1);
    renderPassengerList();
};
document.getElementById('passengerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('passengerName').value;
    const age = parseInt(document.getElementById('passengerAge').value, 10);
    const country = document.getElementById('passengerCountry').value;
    const gender = document.getElementById('passengerGender').value;
    const health_issues = document.getElementById('passengerHealth').checked;
    passengerList.push({ name, age, country, gender, health_issues });
    renderPassengerList();
    document.getElementById('passengerForm').reset();
});

// --- Mission analysis ---
document.getElementById('riskForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const missionName = document.getElementById('missionName').value;
    const launchDate = document.getElementById('launchDate').value;
    const rocketType = document.getElementById('rocketType').value;
    const planet = document.getElementById('planet').value;
    if (passengerList.length === 0) {
        document.getElementById('riskResult').innerHTML = '<span style="color:#ff8080;">Add at least one passenger first!</span>';
        return;
    }
    if (!rocketType || !planet) {
        document.getElementById('riskResult').innerHTML = '<span style="color:#ff8080;">Select rocket type and planet!</span>';
        return;
    }
    // Prepare passengers for backend (remove country)
    const passengers = passengerList.map(p => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        health_issues: p.health_issues
    }));
    const body = {
        mission_name: missionName,
        launch_date: launchDate,
        destination: planet,
        rocket_type: rocketType,
        passengers
    };
    const res = await fetch('http://127.0.0.1:8000/analyze-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        document.getElementById('riskResult').innerHTML = '<span style="color:#ff8080;">Error analyzing mission.</span>';
        return;
    }
    const data = await res.json();
    let html = `<h3>Mission: ${data.mission_name}</h3>`;
    html += `<p><strong>Destination:</strong> ${data.destination} (${data.distance_km.toLocaleString()} km)</p>`;
    html += `<p><strong>Rocket:</strong> ${data.rocket_type}</p>`;
    html += `<p><strong>Total Fuel Required:</strong> ${data.total_fuel_required.toLocaleString()} units</p>`;
    html += `<p><strong>Overall Risk Level:</strong> <span style='color:#ffe082;'>${data.risk_level}</span></p>`;
    html += `<h4>Passenger Analysis:</h4><ul>`;
    data.passenger_analyses.forEach(p => {
        html += `<li>${p.name} (${p.gender}, Age: ${p.age}) - <strong>${p.status}</strong>${p.health_issues ? ' (Health Issues)' : ''}</li>`;
    });
    html += `</ul>`;
    document.getElementById('riskResult').innerHTML = html;
});
