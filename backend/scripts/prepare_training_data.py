import argparse
import importlib.util
import json
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

LABEL_KEYWORDS = {
    "Traffic": ["traffic", "congestion", "road", "jam", "vehicle", "bus", "train", "blocked"],
    "Flood": ["flood", "flooding", "waterlogging", "rain", "storm", "water", "submerged"],
    "Accident": ["accident", "crash", "collision", "wreck", "derail", "pileup", "injured"],
    "Public Gathering": ["crowd", "gathering", "protest", "rally", "festival", "concert", "march"],
    "Emergency": ["fire", "emergency", "evacuation", "collapse", "explosion", "rescue", "earthquake", "disaster"],
}


def weak_label(text: str) -> str | None:
    lowered = str(text).lower()
    scores = {
        label: sum(1 for keyword in keywords if keyword in lowered)
        for label, keywords in LABEL_KEYWORDS.items()
    }
    label, score = max(scores.items(), key=lambda item: item[1])
    return label if score > 0 else None


def read_any_csv(path: Path) -> pd.DataFrame:
    frames = []
    for csv_path in path.rglob("*.csv"):
        frame = pd.read_csv(csv_path, encoding_errors="ignore")
        text_column = next((col for col in ["text", "tweet", "tweet_text", "message", "content"] if col in frame.columns), None)
        if not text_column:
            continue
        usable = frame[[text_column]].rename(columns={text_column: "text"})
        usable["label"] = usable["text"].map(weak_label)
        usable = usable.dropna(subset=["label"])
        frames.append(usable)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["text", "label"])


def local_samples() -> pd.DataFrame:
    sample_path = Path("datasets/sample_data/events.json")
    if not sample_path.exists():
        return pd.DataFrame(columns=["text", "label"])
    rows = json.loads(sample_path.read_text(encoding="utf-8"))
    return pd.DataFrame([{"text": row["text"], "label": row["category"]} for row in rows])


def synthetic_samples() -> pd.DataFrame:
    generator_path = Path("datasets/generate_dataset.py")
    spec = importlib.util.spec_from_file_location("urban_dataset_generator", generator_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    module.generate_dataset(1500)
    path = Path("datasets/raw/urban_events.csv")
    if path.exists():
        return pd.read_csv(path)
    return pd.DataFrame(columns=["text", "label"])


def main():
    parser = argparse.ArgumentParser(description="Prepare train/test CSVs for urban event classification.")
    parser.add_argument("--raw-dir", default="datasets/raw", help="Directory containing downloaded Kaggle CSV files.")
    parser.add_argument("--out-dir", default="datasets/processed", help="Output directory.")
    parser.add_argument("--include-synthetic", action="store_true", help="Add generated local urban examples.")
    args = parser.parse_args()

    raw = read_any_csv(Path(args.raw_dir))
    frames = [raw, local_samples()]
    if args.include_synthetic:
        frames.append(synthetic_samples())

    data = pd.concat(frames, ignore_index=True).dropna()
    data = data[data["label"].isin(LABEL_KEYWORDS)]
    data = data.drop_duplicates(subset=["text"]).sample(frac=1, random_state=42)

    if data.empty:
        raise SystemExit("No usable rows found. Download Kaggle CSVs or run with --include-synthetic.")

    train, test = train_test_split(data, test_size=0.2, random_state=42, stratify=data["label"])
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    train.to_csv(out / "events_train.csv", index=False)
    test.to_csv(out / "events_test.csv", index=False)
    data.to_csv(out / "events_all.csv", index=False)
    print(f"Prepared {len(train)} train rows and {len(test)} test rows in {out}")
    print(data["label"].value_counts().to_string())


if __name__ == "__main__":
    main()
