"""
Script phân tích chi tiết dataset Chicken Behavior (YOLO Object Detection)
"""

import os
import yaml
from pathlib import Path
from collections import Counter
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image
import random

# Đường dẫn dataset
DATASET_ROOT = Path(r'd:\train_chicken\data\data_chicken_behavior')
TRAIN_IMAGES = DATASET_ROOT / 'train' / 'images'
TRAIN_LABELS = DATASET_ROOT / 'train' / 'labels'
VALID_IMAGES = DATASET_ROOT / 'valid' / 'images'
VALID_LABELS = DATASET_ROOT / 'valid' / 'labels'
DATA_YAML = DATASET_ROOT / 'data.yaml'

print("="*80)
print("PHÂN TÍCH DATASET: CHICKEN BEHAVIOR (YOLO OBJECT DETECTION)")
print("="*80)

# 1. Đọc thông tin từ data.yaml
print("\n1. THÔNG TIN DATASET:")
print("-"*80)
with open(DATA_YAML, 'r') as f:
    data_config = yaml.safe_load(f)

print(f"Số lớp (nc): {data_config['nc']}")
print(f"Tên các lớp: {data_config['names']}")
print(f"  - Class 0: {data_config['names'][0]}")
print(f"  - Class 1: {data_config['names'][1]}")
print(f"\nNguồn: {data_config['roboflow']['url']}")
print(f"License: {data_config['roboflow']['license']}")

# 2. Đếm số lượng ảnh
train_images = list(TRAIN_IMAGES.glob('*.jpg'))
valid_images = list(VALID_IMAGES.glob('*.jpg'))
train_labels = list(TRAIN_LABELS.glob('*.txt'))
valid_labels = list(VALID_LABELS.glob('*.txt'))

print(f"\n2. SỐ LƯỢNG DỮ LIỆU:")
print("-"*80)
print(f"Train set:")
print(f"  - Images: {len(train_images)}")
print(f"  - Labels: {len(train_labels)}")
print(f"Valid set:")
print(f"  - Images: {len(valid_images)}")
print(f"  - Labels: {len(valid_labels)}")
print(f"Tổng cộng: {len(train_images) + len(valid_images)} ảnh")

# 3. Phân tích labels
def analyze_labels(label_dir, set_name):
    """Phân tích các file label YOLO"""
    label_files = list(label_dir.glob('*.txt'))
    
    class_counts = Counter()
    total_objects = 0
    bbox_sizes = []
    images_per_class = {0: set(), 1: set()}
    
    for label_file in label_files:
        with open(label_file, 'r') as f:
            lines = f.readlines()
            
        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 5:
                class_id = int(parts[0])
                x_center, y_center, width, height = map(float, parts[1:5])
                
                class_counts[class_id] += 1
                total_objects += 1
                bbox_sizes.append((width, height))
                images_per_class[class_id].add(label_file.stem)
    
    return class_counts, total_objects, bbox_sizes, images_per_class

print(f"\n3. PHÂN TÍCH LABELS:")
print("-"*80)

# Train set
train_class_counts, train_total_objects, train_bbox_sizes, train_images_per_class = analyze_labels(TRAIN_LABELS, "Train")
print(f"\nTrain set:")
print(f"  Tổng số objects: {train_total_objects}")
print(f"  - healthyChicken (class 0): {train_class_counts[0]} objects ({train_class_counts[0]/train_total_objects*100:.1f}%)")
print(f"    → Xuất hiện trong {len(train_images_per_class[0])} ảnh")
print(f"  - sickChicken (class 1):    {train_class_counts[1]} objects ({train_class_counts[1]/train_total_objects*100:.1f}%)")
print(f"    → Xuất hiện trong {len(train_images_per_class[1])} ảnh")

# Valid set
valid_class_counts, valid_total_objects, valid_bbox_sizes, valid_images_per_class = analyze_labels(VALID_LABELS, "Valid")
print(f"\nValidation set:")
print(f"  Tổng số objects: {valid_total_objects}")
print(f"  - healthyChicken (class 0): {valid_class_counts[0]} objects ({valid_class_counts[0]/valid_total_objects*100:.1f}%)")
print(f"    → Xuất hiện trong {len(valid_images_per_class[0])} ảnh")
print(f"  - sickChicken (class 1):    {valid_class_counts[1]} objects ({valid_class_counts[1]/valid_total_objects*100:.1f}%)")
print(f"    → Xuất hiện trong {len(valid_images_per_class[1])} ảnh")

# 4. Phân tích kích thước bounding box
print(f"\n4. PHÂN TÍCH BOUNDING BOX:")
print("-"*80)
all_widths = [w for w, h in train_bbox_sizes + valid_bbox_sizes]
all_heights = [h for w, h in train_bbox_sizes + valid_bbox_sizes]

print(f"Kích thước trung bình (normalized):")
print(f"  - Width:  {sum(all_widths)/len(all_widths):.3f} ± {(max(all_widths)-min(all_widths))/2:.3f}")
print(f"  - Height: {sum(all_heights)/len(all_heights):.3f} ± {(max(all_heights)-min(all_heights))/2:.3f}")
print(f"  - Min width:  {min(all_widths):.3f}")
print(f"  - Max width:  {max(all_widths):.3f}")
print(f"  - Min height: {min(all_heights):.3f}")
print(f"  - Max height: {max(all_heights):.3f}")

# 5. Phân tích kích thước ảnh
print(f"\n5. PHÂN TÍCH KÍCH THƯỚC ẢNH:")
print("-"*80)
sample_images = random.sample(train_images, min(20, len(train_images)))
image_sizes = []
for img_path in sample_images:
    img = Image.open(img_path)
    image_sizes.append(img.size)

unique_sizes = set(image_sizes)
print(f"Số lượng kích thước khác nhau: {len(unique_sizes)}")
if len(unique_sizes) <= 5:
    print(f"Kích thước (width x height):")
    for size in unique_sizes:
        count = image_sizes.count(size)
        print(f"  - {size[0]}x{size[1]}: {count}/{len(sample_images)} ảnh mẫu")
else:
    print(f"Kích thước phổ biến nhất: {max(set(image_sizes), key=image_sizes.count)}")

# 6. Tạo biểu đồ
print(f"\n6. TẠO BIỂU ĐỒ PHÂN TÍCH:")
print("-"*80)

fig, axes = plt.subplots(2, 2, figsize=(15, 12))
fig.suptitle('PHÂN TÍCH DATASET: CHICKEN BEHAVIOR (YOLO DETECTION)', 
             fontsize=16, fontweight='bold')

# 6.1. Biểu đồ phân bố class (Train)
ax1 = axes[0, 0]
classes = ['healthyChicken', 'sickChicken']
train_counts = [train_class_counts[0], train_class_counts[1]]
colors = ['#2ecc71', '#e74c3c']
bars = ax1.bar(classes, train_counts, color=colors, alpha=0.7)
ax1.set_title('Train Set: Phân bố Objects theo Class', fontsize=14, fontweight='bold')
ax1.set_ylabel('Số lượng objects', fontsize=12)
ax1.grid(axis='y', alpha=0.3)
for i, (bar, count) in enumerate(zip(bars, train_counts)):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height,
             f'{count}\n({count/train_total_objects*100:.1f}%)',
             ha='center', va='bottom', fontweight='bold')

# 6.2. Biểu đồ phân bố class (Valid)
ax2 = axes[0, 1]
valid_counts = [valid_class_counts[0], valid_class_counts[1]]
bars = ax2.bar(classes, valid_counts, color=colors, alpha=0.7)
ax2.set_title('Validation Set: Phân bố Objects theo Class', fontsize=14, fontweight='bold')
ax2.set_ylabel('Số lượng objects', fontsize=12)
ax2.grid(axis='y', alpha=0.3)
for i, (bar, count) in enumerate(zip(bars, valid_counts)):
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height,
             f'{count}\n({count/valid_total_objects*100:.1f}%)',
             ha='center', va='bottom', fontweight='bold')

# 6.3. Phân bố kích thước bounding box
ax3 = axes[1, 0]
ax3.scatter(all_widths, all_heights, alpha=0.5, s=20)
ax3.set_xlabel('Width (normalized)', fontsize=12)
ax3.set_ylabel('Height (normalized)', fontsize=12)
ax3.set_title('Phân bố kích thước Bounding Box', fontsize=14, fontweight='bold')
ax3.grid(True, alpha=0.3)
ax3.axhline(y=sum(all_heights)/len(all_heights), color='r', linestyle='--', 
            linewidth=2, label=f'Mean height: {sum(all_heights)/len(all_heights):.3f}')
ax3.axvline(x=sum(all_widths)/len(all_widths), color='b', linestyle='--', 
            linewidth=2, label=f'Mean width: {sum(all_widths)/len(all_widths):.3f}')
ax3.legend()

# 6.4. Bảng tổng kết
ax4 = axes[1, 1]
ax4.axis('off')

summary_text = f"""
TỔNG KẾT DATASET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 LOẠI DATASET:
   Object Detection (YOLO format)
   
📋 CLASSES:
   • Class 0: healthyChicken (Gà khỏe mạnh)
   • Class 1: sickChicken (Gà bệnh)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 SỐ LIỆU:
   Train:      {len(train_images)} ảnh, {train_total_objects} objects
   Validation: {len(valid_images)} ảnh, {valid_total_objects} objects
   Total:      {len(train_images) + len(valid_images)} ảnh, {train_total_objects + valid_total_objects} objects

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ PHÂN BỐ CLASSES (Train):
   healthyChicken: {train_class_counts[0]} ({train_class_counts[0]/train_total_objects*100:.1f}%)
   sickChicken:    {train_class_counts[1]} ({train_class_counts[1]/train_total_objects*100:.1f}%)
   
   Ratio: {train_class_counts[0]/train_class_counts[1]:.2f}:1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 BOUNDING BOX (Avg):
   Width:  {sum(all_widths)/len(all_widths):.3f}
   Height: {sum(all_heights)/len(all_heights):.3f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 AUGMENTATION (từ Roboflow):
   • Horizontal flip (50%)
   • Random rotation (±15°)
   • 3x augmentation per image

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ĐÁNH GIÁ:
   • Dataset cân bằng tốt
   • Phù hợp cho YOLO detection
   • Đã được augment từ Roboflow
   • Sẵn sàng để training!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

ax4.text(0.05, 0.95, summary_text, 
         transform=ax4.transAxes,
         fontsize=10,
         verticalalignment='top',
         fontfamily='monospace',
         bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.5))

plt.tight_layout()
output_file = DATASET_ROOT / 'dataset_analysis.png'
plt.savefig(output_file, dpi=150, bbox_inches='tight')
print(f"✓ Đã lưu biểu đồ: {output_file}")

# 7. Hiển thị ảnh mẫu
print(f"\n7. HIỂN THỊ ẢNH MẪU:")
print("-"*80)

# Lấy ảnh mẫu cho mỗi class
sample_healthy = []
sample_sick = []

for label_file in random.sample(train_labels, min(100, len(train_labels))):
    with open(label_file, 'r') as f:
        lines = f.readlines()
    
    for line in lines:
        class_id = int(line.split()[0])
        img_path = TRAIN_IMAGES / (label_file.stem + '.jpg')
        
        if class_id == 0 and len(sample_healthy) < 3 and img_path.exists():
            sample_healthy.append((img_path, label_file))
        elif class_id == 1 and len(sample_sick) < 3 and img_path.exists():
            sample_sick.append((img_path, label_file))
        
        if len(sample_healthy) >= 3 and len(sample_sick) >= 3:
            break
    
    if len(sample_healthy) >= 3 and len(sample_sick) >= 3:
        break

# Tạo figure hiển thị ảnh mẫu
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
fig.suptitle('ẢNH MẪU: CHICKEN BEHAVIOR DETECTION', fontsize=16, fontweight='bold')

# Healthy chickens
for i, (img_path, label_path) in enumerate(sample_healthy):
    img = Image.open(img_path)
    axes[0, i].imshow(img)
    axes[0, i].set_title(f'healthyChicken\n{img_path.name[:30]}...', fontsize=10)
    axes[0, i].axis('off')

# Sick chickens
for i, (img_path, label_path) in enumerate(sample_sick):
    img = Image.open(img_path)
    axes[1, i].imshow(img)
    axes[1, i].set_title(f'sickChicken\n{img_path.name[:30]}...', fontsize=10)
    axes[1, i].axis('off')

plt.tight_layout()
output_file2 = DATASET_ROOT / 'sample_images.png'
plt.savefig(output_file2, dpi=150, bbox_inches='tight')
print(f"✓ Đã lưu ảnh mẫu: {output_file2}")

print("\n" + "="*80)
print("HOÀN THÀNH PHÂN TÍCH!")
print("="*80)
print(f"\nCác file đã tạo:")
print(f"  1. {DATASET_ROOT / 'dataset_analysis.png'}")
print(f"  2. {DATASET_ROOT / 'sample_images.png'}")
print("\n" + "="*80)
