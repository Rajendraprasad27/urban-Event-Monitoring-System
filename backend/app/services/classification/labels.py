EVENT_LABELS = [
    "Traffic",
    "Accident",
    "Weather",
    "Flood",
    "Fire",
    "Public Gathering",
    "Emergency",
    "Crime",
    "Infrastructure",
    "Health",
    "Political Event",
    "Protest",
    "Transport Disruption",
    "Utility Failure",
    "Other",
]

ID_TO_LABEL = {index: label for index, label in enumerate(EVENT_LABELS)}
LABEL_TO_ID = {label: index for index, label in ID_TO_LABEL.items()}
