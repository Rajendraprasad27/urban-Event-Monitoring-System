# Model Training

The project supports fine-tuning a DistilBERT text classifier into `ml_models/bert-event-classifier`.

## Dataset Choice

Good online sources include Kaggle crisis/disaster tweet datasets such as:

- `jannesklaas/disasters-on-social-media`
- `nihajasminesk/disaster-or-not-dataset`
- Kaggle competition: `nlp-getting-started`

Most public Kaggle disaster tweet datasets are binary disaster/not-disaster. This project needs five labels: `Traffic`, `Flood`, `Accident`, `Public Gathering`, and `Emergency`. The preparation script weak-labels downloaded text with transparent keyword rules and can merge local urban examples.

## Kaggle Setup

Create a Kaggle API token from your Kaggle account settings and configure:

```powershell
$env:KAGGLE_USERNAME="your_username"
$env:KAGGLE_KEY="your_api_key"
```

## Download Data

```powershell
cd D:\Urban-Event-Monitoring-System
python backend\scripts\download_kaggle_dataset.py --dataset jannesklaas/disasters-on-social-media
```

## Prepare Train/Test CSVs

```powershell
python backend\scripts\prepare_training_data.py --raw-dir datasets\raw --include-synthetic
```

Outputs:

- `datasets/processed/events_train.csv`
- `datasets/processed/events_test.csv`
- `datasets/processed/events_all.csv`

## Train DistilBERT

```powershell
$env:PYTHONPATH="backend"
python backend\scripts\train_event_classifier.py --epochs 3 --batch-size 8
```

The trained model is saved to:

```text
ml_models/bert-event-classifier
```

Set `ENABLE_AI_MODELS=true` in `backend/.env` to make the API load this model.
