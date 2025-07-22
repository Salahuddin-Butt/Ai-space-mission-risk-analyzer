from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import date

app = FastAPI()

# --- Data ---
PLANETS = {
    "The Moon": 384_400,  # in km
    "Mercury": 91_000_000,
    "Venus": 41_000_000,
    "Mars": 78_000_000,
    "Jupiter": 628_000_000,
    "Saturn": 1_275_000_000,
    "Uranus": 2_724_000_000,
    "Neptune": 4_351_000_000,
    "Pluto": 5_900_000_000
}
ROCKETS = [
    {"name": "Saturn V", "fuel_per_million_km": 150},
    {"name": "Falcon 9", "fuel_per_million_km": 90},
    {"name": "Falcon Heavy", "fuel_per_million_km": 85},
    {"name": "Starship", "fuel_per_million_km": 70},
    {"name": "Soyuz", "fuel_per_million_km": 110},
    {"name": "SLS", "fuel_per_million_km": 140},
    {"name": "Atlas V", "fuel_per_million_km": 100},
    {"name": "Delta II", "fuel_per_million_km": 120},
    {"name": "Ariane 5", "fuel_per_million_km": 105},
    {"name": "Long March 5", "fuel_per_million_km": 115}
]

# --- Models ---
class Passenger(BaseModel):
    name: str
    age: int
    gender: Literal["male", "female"]
    health_issues: bool = False

class MissionRequest(BaseModel):
    mission_name: str
    launch_date: date
    destination: str
    rocket_type: str
    passengers: List[Passenger]

class PassengerAnalysis(BaseModel):
    name: str
    age: int
    gender: str
    health_issues: bool
    status: str

class MissionAnalysisResponse(BaseModel):
    mission_name: str
    destination: str
    distance_km: int
    rocket_type: str
    total_fuel_required: int
    passenger_analyses: List[PassengerAnalysis]
    risk_level: str

# --- Helper Functions ---
def calculate_fuel(distance_km: int, rocket_type: str) -> int:
    rocket = next((r for r in ROCKETS if r["name"] == rocket_type), ROCKETS[0])
    return int((distance_km / 1_000_000) * rocket["fuel_per_million_km"])

def analyze_passenger(passenger: Passenger) -> PassengerAnalysis:
    status = "OK"
    if passenger.age < 18 or passenger.age > 65:
        status = "At Risk (Age)"
    if passenger.health_issues:
        status = "At Risk (Health)"
    return PassengerAnalysis(
        name=passenger.name,
        age=passenger.age,
        gender=passenger.gender,
        health_issues=passenger.health_issues,
        status=status
    )

def ai_risk_level(passengers: List[PassengerAnalysis], distance_km: int) -> str:
    risk = 0
    for p in passengers:
        if "At Risk" in p.status:
            risk += 2
    if distance_km > 1_000_000_000:
        risk += 2
    elif distance_km > 500_000_000:
        risk += 1
    if risk == 0:
        return "Low"
    elif risk <= 2:
        return "Moderate"
    elif risk <= 4:
        return "High"
    else:
        return "Critical"

# --- Endpoints ---
@app.get("/planets")
def get_planets():
    return {"planets": [{"name": k, "distance_km": v} for k, v in PLANETS.items()]}

@app.get("/rockets")
def get_rockets():
    return {"rockets": ROCKETS}

@app.post("/analyze-mission", response_model=MissionAnalysisResponse)
def analyze_mission(data: MissionRequest):
    distance = PLANETS.get(data.destination, 0)
    fuel = calculate_fuel(distance, data.rocket_type)
    passenger_analyses = [analyze_passenger(p) for p in data.passengers]
    risk = ai_risk_level(passenger_analyses, distance)
    return MissionAnalysisResponse(
        mission_name=data.mission_name,
        destination=data.destination,
        distance_km=distance,
        rocket_type=data.rocket_type,
        total_fuel_required=fuel,
        passenger_analyses=passenger_analyses,
        risk_level=risk
    ) 