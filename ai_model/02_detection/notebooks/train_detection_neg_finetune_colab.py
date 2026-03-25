import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


def ensure_package(package: str) -> None:
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", package],
        check=True,
    )


ensure_package("ultralytics")

from google.colab import drive  # type: ignore
from ultralytics import YOLO


# Mount Google Drive
drive.mount("/content/drive")


# ====== CONFIG ======
DRIVE_ROOT = Path("/content/drive/MyDrive/chicken_detection")
DATASET_ZIP = DRIVE_ROOT / "merged_dataset.zip"
BEST_MODEL = DRIVE_ROOT / "runs" / "detect" / "chicken_detection" / "weights" / "best.pt"
DATASET_ROOT = Path("/content/merged_dataset")
RUNS_ROOT = DRIVE_ROOT / "runs" / "detect"
RUN_NAME = "chicken_detection_neg_v1"

EPOCHS = 20
IMG_SIZE = 640
BATCH_SIZE = 16
PATIENCE = 8
LEARNING_RATE = 0.003
# ====================


print("=" * 80)
print("CHICKEN DETECTION NEGATIVE FINE-TUNE")
print("=" * 80)
print(f"Dataset zip : {DATASET_ZIP}")
print(f"Base model  : {BEST_MODEL}")
print(f"Output run  : {RUNS_ROOT / RUN_NAME}")

if not DATASET_ZIP.exists():
    raise FileNotFoundError(f"Khong tim thay dataset zip: {DATASET_ZIP}")

if not BEST_MODEL.exists():
    raise FileNotFoundError(f"Khong tim thay best.pt de fine-tune: {BEST_MODEL}")


# Clean old extracted dataset to avoid mixing versions
if DATASET_ROOT.exists():
    shutil.rmtree(DATASET_ROOT)


print("\nDang giai nen dataset moi...")
with zipfile.ZipFile(DATASET_ZIP, "r") as zip_ref:
    zip_ref.extractall("/content")

data_yaml = DATASET_ROOT / "data.yaml"
if not data_yaml.exists():
    raise FileNotFoundError(f"Khong tim thay data.yaml sau khi giai nen: {data_yaml}")

print(f"Dataset san sang tai: {DATASET_ROOT}")


print("\nDang nap model best.pt de fine-tune...")
model = YOLO(str(BEST_MODEL))


print("\nBat dau fine-tune...")
results = model.train(
    data=str(data_yaml),
    epochs=EPOCHS,
    imgsz=IMG_SIZE,
    batch=BATCH_SIZE,
    device=0,
    patience=PATIENCE,
    lr0=LEARNING_RATE,
    save=True,
    project=str(RUNS_ROOT),
    name=RUN_NAME,
    exist_ok=True,
    plots=True,
    verbose=True,
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=10,
    translate=0.1,
    scale=0.5,
    shear=2.0,
    flipud=0.0,
    fliplr=0.5,
    mosaic=1.0,
    mixup=0.1,
)

print("\nTraining xong. Danh gia model...")
best_finetuned = RUNS_ROOT / RUN_NAME / "weights" / "best.pt"
best_model = YOLO(str(best_finetuned))

val_metrics = best_model.val(data=str(data_yaml))
test_metrics = best_model.val(data=str(data_yaml), split="test")

print("\n" + "=" * 80)
print("KET QUA FINE-TUNE")
print("=" * 80)
print(f"Best model moi: {best_finetuned}")
print(f"Validation mAP50      : {val_metrics.box.map50:.4f}")
print(f"Validation mAP50-95   : {val_metrics.box.map:.4f}")
print(f"Validation Precision  : {val_metrics.box.mp:.4f}")
print(f"Validation Recall     : {val_metrics.box.mr:.4f}")
print(f"Test mAP50            : {test_metrics.box.map50:.4f}")
print(f"Test mAP50-95         : {test_metrics.box.map:.4f}")
print(f"Test Precision        : {test_metrics.box.mp:.4f}")
print(f"Test Recall           : {test_metrics.box.mr:.4f}")
print("=" * 80)

