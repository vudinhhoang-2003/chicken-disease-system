"""
Script de doc va truc quan hoa du lieu data_phan_chicken
"""

import os
import sys

# Fix encoding cho Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Kiem tra va cai dat thu vien neu can
def install_package(package):
    try:
        __import__(package)
        return True
    except ImportError:
        print(f"Dang cai dat {package}...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"OK Da cai dat {package}")
            return True
        except Exception as e:
            print(f"LOI: Khong the cai dat {package}. Vui long chay: pip install {package}")
            return False

# Cai dat cac thu vien can thiet
print("Dang kiem tra thu vien...")
if not install_package("pandas"):
    sys.exit(1)
if not install_package("matplotlib"):
    sys.exit(1)
if not install_package("Pillow"):
    sys.exit(1)

try:
    import pandas as pd
    import matplotlib.pyplot as plt
    from PIL import Image
    from math import ceil
    print("OK Tat ca thu vien da san sang!")
except ImportError as e:
    print(f"LOI: Thieu thu vien: {e}")
    print("Vui long chay: pip install pandas matplotlib Pillow")
    sys.exit(1)

# Đường dẫn dữ liệu
DATA_DIR = os.path.join('data', 'data_phan_chicken')
IMAGES_DIR = os.path.join(DATA_DIR, 'data')
CSV_PATH = os.path.join(DATA_DIR, 'data.csv')

print(f"\n{'='*60}")
print("PHAN TICH DU LIEU DATA_PHAN_CHICKEN")
print(f"{'='*60}\n")

# 1. Doc du lieu
print("1. Dang doc du lieu tu CSV...")
if not os.path.exists(CSV_PATH):
    print(f"LOI: Khong tim thay file: {CSV_PATH}")
    sys.exit(1)

df = pd.read_csv(CSV_PATH)
print(f"OK Da doc {len(df)} mau")
print(f"OK Cac cot: {df.columns.tolist()}\n")

# 2. Thong ke co ban
print("2. Thong ke phan bo nhan:")
print("-" * 40)
label_counts = df['label'].value_counts().sort_values(ascending=False)
for label, count in label_counts.items():
    percentage = (count / len(df)) * 100
    print(f"  {label:25s}: {count:5d} mau ({percentage:5.1f}%)")
print()

# 3. Ve bieu do phan bo
print("3. Dang tao bieu do phan bo nhan...")
plt.figure(figsize=(10, 6))
bars = label_counts.plot(kind='bar', color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'])
plt.title('Phan bo so luong mau theo nhan benh', fontsize=14, fontweight='bold')
plt.xlabel('Nhan benh', fontsize=12)
plt.ylabel('So luong mau', fontsize=12)
plt.xticks(rotation=30, ha='right')
plt.grid(axis='y', alpha=0.3)

# Them so lieu len moi cot
for i, (label, count) in enumerate(label_counts.items()):
    plt.text(i, count + 50, str(count), ha='center', va='bottom', fontweight='bold')

plt.tight_layout()
output_file = 'phan_bo_nhan.png'
plt.savefig(output_file, dpi=150, bbox_inches='tight')
print(f"OK Da luu bieu do: {output_file}")
plt.show()

# 4. Ve bieu do tron
print("\n4. Dang tao bieu do tron...")
plt.figure(figsize=(8, 8))
colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
plt.pie(label_counts.values, labels=label_counts.index, autopct='%1.1f%%', 
        startangle=90, colors=colors[:len(label_counts)])
plt.title('Ty le phan bo cac loai benh', fontsize=14, fontweight='bold')
plt.axis('equal')
output_file2 = 'ty_le_phan_bo.png'
plt.savefig(output_file2, dpi=150, bbox_inches='tight')
print(f"OK Da luu bieu do: {output_file2}")
plt.show()

# 5. Hien thi anh mau
print("\n5. Dang hien thi anh mau cho moi loai...")
labels = df['label'].unique()
num_per_label = 4  # so anh muon xem cho moi loai

for label in labels:
    subset = df[df['label'] == label].sample(
        min(num_per_label, (df['label'] == label).sum()), 
        random_state=42
    )
    n = len(subset)
    cols = min(4, n)
    rows = ceil(n / cols)

    plt.figure(figsize=(3 * cols, 3 * rows))
    plt.suptitle(f'Vi du anh: {label} ({len(df[df["label"] == label])} mau)', 
                 fontsize=14, fontweight='bold')

    for i, (_, row) in enumerate(subset.iterrows()):
        img_name = row['images']
        img_path = os.path.join(IMAGES_DIR, img_name)
        
        if not os.path.exists(img_path):
            plt.subplot(rows, cols, i + 1)
            plt.text(0.5, 0.5, f'Khong tim thay\n{img_name}', 
                    ha='center', va='center', fontsize=10)
            plt.axis('off')
            continue
            
        try:
            img = Image.open(img_path).convert('RGB')
            plt.subplot(rows, cols, i + 1)
            plt.imshow(img)
            plt.axis('off')
            plt.title(img_name, fontsize=8)
        except Exception as e:
            plt.subplot(rows, cols, i + 1)
            plt.text(0.5, 0.5, f'Loi doc anh\n{str(e)[:30]}', 
                    ha='center', va='center', fontsize=8)
            plt.axis('off')

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    output_file3 = f'anh_mau_{label.replace(" ", "_")}.png'
    plt.savefig(output_file3, dpi=150, bbox_inches='tight')
    print(f"OK Da luu anh mau: {output_file3}")
    plt.show()

print(f"\n{'='*60}")
print("HOAN THANH!")
print(f"{'='*60}")
print("\nCac file da tao:")
print("  - phan_bo_nhan.png: Bieu do cot phan bo nhan")
print("  - ty_le_phan_bo.png: Bieu do tron ty le")
print("  - anh_mau_*.png: Anh mau cho moi loai benh")

