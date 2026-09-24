from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from flask import Flask, abort, render_template, request, send_file, url_for
import markdown


ROOT = Path(__file__).resolve().parent
DISPLAY_TITLE = "EVE-NG RoCEv2 / MPLS-LDP / EVPN-VXLAN / QoS Lab"
HOME_IMAGE = "cls_practice_eveng_topology.png"
TEXT_EXTENSIONS = {
    ".md",
    ".txt",
    ".cfg",
    ".conf",
    ".sh",
    ".unl",
    ".json",
    ".yaml",
    ".yml",
}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}


@dataclass(frozen=True)
class FileEntry:
    name: str
    rel_path: str
    category: str
    kind: str
    size_kb: int


app = Flask(__name__, template_folder=str(ROOT / "templates"), static_folder=str(ROOT / "static"))
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0


def iter_repo_files() -> Iterable[Path]:
    skip_dirs = {"__pycache__", ".git", "templates", "static"}
    skip_names = {".DS_Store", "dashboard_app.py", "generate_lab_pdf.py", "generate_qos_workbook_pdf.py"}
    skip_extensions = {".pyc", ".py", ".unl"}
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        if path.name in skip_names:
            continue
        if path.suffix.lower() in skip_extensions:
            continue
        yield path


def detect_kind(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return "pdf"
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in TEXT_EXTENSIONS or suffix == "":
        return "text"
    return "binary"


def detect_category(path: Path) -> str:
    rel = path.relative_to(ROOT)
    name = path.name.lower()

    if path.name == "README.md":
        return "Home"
    if rel.parts[0] == "configs":
        return "CONFIGS"
    if name.endswith(".pdf"):
        return "Workbooks"
    if path.suffix.lower() in IMAGE_EXTENSIONS:
        return "Topology"
    if "validation" in name:
        return "VALIDATIONS"
    if "workbook" in name or "guide" in name or rel.parts[0] == "docs":
        return "Home"
    return "Home"


def build_index() -> list[FileEntry]:
    files = []
    for path in iter_repo_files():
        rel_path = path.relative_to(ROOT).as_posix()
        files.append(
            FileEntry(
                name=path.name,
                rel_path=rel_path,
                category=detect_category(path),
                kind=detect_kind(path),
                size_kb=max(1, round(path.stat().st_size / 1024)),
            )
        )
    return files


def safe_resolve(rel_path: str) -> Path:
    path = (ROOT / rel_path).resolve()
    if ROOT not in path.parents and path != ROOT:
        abort(404)
    if not path.exists() or not path.is_file():
        abort(404)
    return path


def render_markdown(text: str) -> str:
    return markdown.markdown(
        text,
        extensions=["fenced_code", "tables", "toc", "sane_lists"],
        output_format="html5",
    )


@app.route("/")
def dashboard():
    files = build_index()
    categories = ["Home", "Workbooks", "Topology", "CONFIGS", "VALIDATIONS"]
    requested_category = request.args.get("tab", "Home")
    active_category = requested_category if requested_category in categories else "Home"

    visible_files = [f for f in files if f.category == active_category]
    default_file = "README.md" if active_category == "Home" else (visible_files[0].rel_path if visible_files else "README.md")
    selected_rel = request.args.get("file", default_file)
    valid_choices = {f.rel_path for f in visible_files}
    if selected_rel not in valid_choices:
        selected_rel = default_file

    selected_path = safe_resolve(selected_rel)
    selected_kind = detect_kind(selected_path)
    content = None
    rendered_html = None

    if selected_kind == "text":
        content = selected_path.read_text(encoding="utf-8", errors="replace")
        if selected_path.suffix.lower() == ".md":
            rendered_html = render_markdown(content)

    return render_template(
        "dashboard.html",
        dashboard_title=DISPLAY_TITLE,
        home_image=HOME_IMAGE,
        categories=categories,
        active_category=active_category,
        files=visible_files,
        selected_rel=selected_rel,
        selected_name=selected_path.name,
        selected_kind=selected_kind,
        rendered_html=rendered_html,
        raw_text=content,
    )


@app.route("/content/<path:rel_path>")
def content(rel_path: str):
    path = safe_resolve(rel_path)
    response = send_file(path, max_age=0)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/health")
def health():
    return {"status": "ok", "repo": ROOT.name}


@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5055)
