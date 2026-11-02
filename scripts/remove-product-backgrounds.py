from pathlib import Path
from io import BytesIO
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove, new_session

ROOT = Path.cwd()
IMAGE_DIR = ROOT / "assets" / "js"
FILES = sorted(p for p in IMAGE_DIR.iterdir() if p.suffix.lower() in {".jpg", ".jpeg"})
session = new_session("u2netp")
processed = 0

for source in FILES:
    output = source.with_suffix(".webp")
    if not source.exists():
        continue

    # Always start from the original photo so the cutout does not compound artifacts.
    original = Image.open(source).convert("RGB")
    original.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
    cutout = remove(original, session=session, alpha_matting=False, post_process_mask=True)
    if not isinstance(cutout, Image.Image):
        cutout = Image.open(BytesIO(cutout))
    cutout = cutout.convert("RGBA")

    alpha = cutout.getchannel("A")
    # Ignore faint segmentation noise when finding the product bounds.
    mask = alpha.point(lambda value: 255 if value > 18 else 0)
    bounds = mask.getbbox()
    if not bounds:
        print(f"SKIP {source.name}: no reliable foreground detected")
        continue

    # Crop tightly around the jewelry, then add consistent breathing room.
    cutout = cutout.crop(bounds)
    alpha = cutout.getchannel("A")
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.25))
    cutout.putalpha(alpha)

    canvas_size = 1200
    max_product = int(canvas_size * 0.80)
    cutout.thumbnail((max_product, max_product), Image.Resampling.LANCZOS)

    # Very subtle clarity/color enhancement without changing the jewelry design.
    rgb = Image.new("RGB", cutout.size, (248, 245, 240))
    rgb.paste(cutout, mask=cutout.getchannel("A"))
    rgb = ImageEnhance.Color(rgb).enhance(1.025)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.015)
    adjusted = Image.merge("RGBA", (*rgb.split(), cutout.getchannel("A")))

    # Re-center on a transparent square so every product card has a consistent composition.
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = (canvas_size - adjusted.width) // 2
    y = (canvas_size - adjusted.height) // 2
    canvas.alpha_composite(adjusted, (x, y))

    # Transparent WebP retains the existing site paths and keeps images lightweight.
    canvas.save(output, "WEBP", quality=90, method=6, lossless=False, exact=True)
    processed += 1
    print(f"Processed {source.name} -> {output.name}")

print(f"Finished: {processed}/{len(FILES)} product images processed.")
