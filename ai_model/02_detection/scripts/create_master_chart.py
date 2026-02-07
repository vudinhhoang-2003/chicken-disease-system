import matplotlib.pyplot as plt
import numpy as np

# Data setup
stages = ['Train (Huấn luyện)', 'Validation (Kiểm định)', 'Test (Kiểm tra)']
image_counts = [2781, 277, 117]
healthy_boxes = [2580, 260, 130]
sick_boxes = [10850, 1120, 399]

# Calculate totals
total_images = sum(image_counts)
total_healthy = sum(healthy_boxes)
total_sick = sum(sick_boxes)
total_boxes = total_healthy + total_sick

# Set colors
colors_split = ['#4caf50', '#ff9800', '#2196f3']
colors_classes = ['#2e7d32', '#d32f2f']

# Create a figure with 2 subplots
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))

# --- PLOT 1: Dataset Split (Images) ---
wedges, texts, autotexts = ax1.pie(
    image_counts, 
    labels=stages, 
    autopct='%1.1f%%', 
    startangle=140, 
    colors=colors_split,
    explode=(0.05, 0.05, 0.05),
    textprops={'weight': 'bold'}
)
ax1.set_title(f'Phân bổ tập dữ liệu (Tổng: {total_images:,} ảnh)', fontsize=14, pad=20, weight='bold')

# Add legend with raw counts for images
legend_labels = [f'{s}: {c:,} ảnh' for s, c in zip(stages, image_counts)]
ax1.legend(wedges, legend_labels, title="Số lượng ảnh", loc="lower center", bbox_to_anchor=(0.5, -0.15))

# --- PLOT 2: Class Balance (Boxes/Objects) ---
x = np.arange(len(stages))
width = 0.35

rects1 = ax2.bar(x - width/2, healthy_boxes, width, label='Gà khỏe (Healthy)', color=colors_classes[0])
rects2 = ax2.bar(x + width/2, sick_boxes, width, label='Gà bệnh (Sick)', color=colors_classes[1])

ax2.set_ylabel('Số lượng đối tượng (Boxes)')
ax2.set_title(f'Cân bằng Lớp trong các tập (Tổng: {total_boxes:,} đối tượng)', fontsize=14, pad=20, weight='bold')
ax2.set_xticks(x)
ax2.set_xticklabels(stages)
ax2.legend()

# Add labels on top of bars
def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax2.annotate(f'{int(height):,}',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9, weight='bold')

autolabel(rects1)
autolabel(rects2)

plt.tight_layout()
plt.savefig('dataset_comprehensive_analysis.png', dpi=200)
plt.close()

print("Success: Generated dataset_comprehensive_analysis.png")
