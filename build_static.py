from __future__ import annotations

import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
ARCHIVE = ROOT / "ANGEL-public.zip"
PUBLIC_FILES = ("index.html", "styles.css", "app.js")


def main() -> None:
    DIST.mkdir(exist_ok=True)

    for name in PUBLIC_FILES:
        shutil.copy2(ROOT / name, DIST / name)

    assets_dist = DIST / "assets"
    assets_dist.mkdir(exist_ok=True)
    for asset in (ROOT / "assets").iterdir():
        if asset.is_file():
            shutil.copy2(asset, assets_dist / asset.name)

    with zipfile.ZipFile(ARCHIVE, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_path in DIST.rglob("*"):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(DIST).as_posix())
    print("Static site build complete")


if __name__ == "__main__":
    main()
