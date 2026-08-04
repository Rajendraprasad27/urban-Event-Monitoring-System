import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

from app.services.classification.labels import EVENT_LABELS, ID_TO_LABEL, LABEL_TO_ID


def main():
    parser = argparse.ArgumentParser(description="Fine-tune DistilBERT for urban event classification.")
    parser.add_argument("--train", default="datasets/processed/events_train.csv")
    parser.add_argument("--test", default="datasets/processed/events_test.csv")
    parser.add_argument("--model", default="distilbert-base-uncased")
    parser.add_argument("--output", default="ml_models/bert-event-classifier")
    parser.add_argument("--epochs", type=float, default=3)
    parser.add_argument("--batch-size", type=int, default=8)
    args = parser.parse_args()

    train_df = pd.read_csv(args.train)
    test_df = pd.read_csv(args.test)
    train_df = train_df[train_df["label"].isin(EVENT_LABELS)]
    test_df = test_df[test_df["label"].isin(EVENT_LABELS)]
    train_df["labels"] = train_df["label"].map(LABEL_TO_ID)
    test_df["labels"] = test_df["label"].map(LABEL_TO_ID)

    try:
        from datasets import Dataset
    except ImportError as exc:
        raise SystemExit("Install datasets first: pip install datasets accelerate") from exc

    tokenizer = AutoTokenizer.from_pretrained(args.model)

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=160)

    train_ds = Dataset.from_pandas(train_df[["text", "labels"]]).map(tokenize, batched=True)
    test_ds = Dataset.from_pandas(test_df[["text", "labels"]]).map(tokenize, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model,
        num_labels=len(EVENT_LABELS),
        id2label=ID_TO_LABEL,
        label2id=LABEL_TO_ID,
    )

    def metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": accuracy_score(labels, preds),
            "f1_macro": f1_score(labels, preds, average="macro"),
        }

    training_args = TrainingArguments(
        output_dir=args.output,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=test_ds,
        processing_class=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=metrics,
    )
    trainer.train()
    results = trainer.evaluate()

    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    trainer.save_model(output)
    tokenizer.save_pretrained(output)
    (output / "metrics.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
