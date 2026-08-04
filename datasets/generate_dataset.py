import pandas as pd
import random
import os

# Define categories and sample templates
categories = ["Traffic", "Flood", "Accident", "Public Gathering", "Emergency"]

templates = {
    "Traffic": [
        "Huge traffic jam near {location}.",
        "Avoid {location}, bumper to bumper traffic.",
        "Traffic is at a standstill around {location}.",
        "Heavy congestion reported at {location} junction.",
        "Expect delays near {location} due to slow moving traffic."
    ],
    "Flood": [
        "Severe waterlogging at {location}.",
        "Flooding reported near {location}, roads are blocked.",
        "Avoid {location}, waist-deep water after heavy rains.",
        "Drains overflowing in {location}, area flooded.",
        "Rain has caused massive flooding in {location}."
    ],
    "Accident": [
        "Major accident reported at {location}.",
        "Car crash near {location}, police on scene.",
        "Accident causing traffic pile-up at {location}.",
        "Two-wheeler collision in {location}, ambulance requested.",
        "Drive safe, accident spotted around {location}."
    ],
    "Public Gathering": [
        "Huge crowd gathering at {location} for the protest.",
        "Festival celebrations ongoing at {location}, expect crowds.",
        "Public meeting at {location} causing road diversions.",
        "Concert tonight at {location}, lots of people.",
        "Rally moving through {location}, avoid the route."
    ],
    "Emergency": [
        "Fire broke out at a building in {location}, fire engines rushing.",
        "Medical emergency near {location}, please make way for ambulance.",
        "Building collapse reported in {location}, rescue teams deployed.",
        "Gas leak suspected in {location}, evacuate immediately.",
        "Explosion heard near {location}, police investigating."
    ]
}

locations = [
    "Koramangala", "Indiranagar", "Whitefield", "Electronic City", 
    "Majestic", "Jayanagar", "JP Nagar", "Marathahalli", "Bellandur", 
    "HSR Layout", "Malleswaram", "Hebbal", "Yelahanka", "MG Road"
]

def generate_dataset(num_samples=5000):
    data = []
    for _ in range(num_samples):
        category = random.choice(categories)
        template = random.choice(templates[category])
        location = random.choice(locations)
        
        # Add some random noise/extra text for realism
        noise = random.choice(["", " Pls avoid.", " Just saw this.", " Anyone know what happened?", " Stay safe guys.", " So frustrating!"])
        text = template.format(location=location) + noise
        
        data.append({
            "text": text,
            "label": category
        })
    
    df = pd.DataFrame(data)
    
    output_dir = os.path.join("datasets", "raw")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "urban_events.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated dataset with {len(df)} samples at {output_path}")

if __name__ == "__main__":
    generate_dataset(5000)
