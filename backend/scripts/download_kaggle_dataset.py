import argparse
import zipfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Download a Kaggle dataset into datasets/raw.")
    parser.add_argument("--dataset", default="jannesklaas/disasters-on-social-media", help="Kaggle dataset slug.")
    parser.add_argument("--output", default="datasets/raw/kaggle", help="Output directory.")
    args = parser.parse_args()

    try:
        import kaggle
    except ImportError as exc:
        raise SystemExit("Install kaggle first: pip install kaggle") from exc

    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    kaggle.api.authenticate()
    kaggle.api.dataset_download_files(args.dataset, path=str(output), unzip=False)

    for archive in output.glob("*.zip"):
        with zipfile.ZipFile(archive) as zipped:
            zipped.extractall(output)
        archive.unlink()

    print(f"Downloaded {args.dataset} to {output}")


if __name__ == "__main__":
    main()
