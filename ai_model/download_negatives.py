from bing_image_downloader import downloader


OUTPUT_DIR = "negative_images"
LIMIT_PER_QUERY = 50

# Non-chicken / background queries to reduce detector false positives.
QUERIES = [
    "wire mesh fence",
    "farm tools on ground",
    "animal feed bag floor",
    "plastic water bucket farm",
    "goat standing field",
    "cow standing field",
    "rabbit on grass",
    "horse in stable",
    "wooden pallet farm",
]


for index, query in enumerate(QUERIES, start=1):
    print(f"[{index}/{len(QUERIES)}] Downloading images for: {query}")
    try:
        downloader.download(
            query,
            limit=LIMIT_PER_QUERY,
            output_dir=OUTPUT_DIR,
            adult_filter_off=True,
            force_replace=False,
            timeout=60,
        )
    except Exception as exc:
        print(f"Skipping query due to error: {exc}")

print("Negative image download completed.")
