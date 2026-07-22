"""
MOOVED E-Bike Multi-Model Survey v2
Flask + SQLite | One form = one salesperson + N vehicle models
Tables: submissions (basic info) + submissions_vehicles (multiple bikes per form)
"""
import sqlite3, os, json
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
DB_PATH = os.path.join(BASE_DIR, "survey.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        salesperson TEXT NOT NULL,
        region TEXT NOT NULL,
        district TEXT,
        submitted_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submissions_vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        photo TEXT,
        range_km REAL,
        charging_time_h REAL,
        weight_kg REAL,
        price_ghs REAL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', 'mooved2026');
    """)
    conn.close()


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/api/submissions", methods=["GET"])
def api_submissions():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    region = request.args.get("region", "")
    search = request.args.get("search", "")
    offset = (page - 1) * limit
    conn = get_db()
    where = ["1=1"]
    params = []
    if region:
        where.append("s.region = ?")
        params.append(region)
    if search:
        where.append("(s.salesperson LIKE ? OR s.district LIKE ? OR sv.notes LIKE ?)")
        params.extend(["%" + search + "%", "%" + search + "%", "%" + search + "%"])
    where_sql = " AND ".join(where)
    count_row = conn.execute(
        "SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s LEFT JOIN submissions_vehicles sv ON sv.submission_id = s.id WHERE " + where_sql, params
    ).fetchone()
    total = count_row["cnt"]
    rows = conn.execute(
        "SELECT DISTINCT s.* FROM submissions s LEFT JOIN submissions_vehicles sv ON sv.submission_id = s.id WHERE " + where_sql + " ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset]
    ).fetchall()
    result = []
    for s in rows:
        vehicles = conn.execute("SELECT * FROM submissions_vehicles WHERE submission_id=? ORDER BY created_at", (s["id"],)).fetchall()
        item = dict(s)
        item["vehicles"] = [dict(v) for v in vehicles]
        result.append(item)
    conn.close()
    return jsonify({"data": result, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)})


@app.route("/api/submissions/<int:sid>", methods=["GET"])
def api_submission_detail(sid):
    conn = get_db()
    row = conn.execute("SELECT * FROM submissions WHERE id=?", (sid,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "not found"}), 404
    vehicles = conn.execute("SELECT * FROM submissions_vehicles WHERE submission_id=? ORDER BY created_at", (sid,)).fetchall()
    data = dict(row)
    data["vehicles"] = [dict(v) for v in vehicles]
    conn.close()
    return jsonify(data)


@app.route("/api/submissions", methods=["POST"])
def api_submit():
    d = request.json
    required = ["salesperson", "region", "vehicles"]
    missing = [f for f in required if not d.get(f)]
    if missing:
        return jsonify({"error": "missing fields: " + ", ".join(missing)}), 400
    vehicles = d.get("vehicles", [])
    if len(vehicles) == 0:
        return jsonify({"error": "at least one vehicle required"}), 400
    for i, v in enumerate(vehicles):
        if not v.get("price_ghs") and not v.get("range_km"):
            return jsonify({"error": "vehicle %d: price_ghs or range_km required" % (i+1)}), 400
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO submissions (salesperson, region, district, submitted_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (d["salesperson"], d["region"], d.get("district", ""), now, now)
    )
    sub_id = cur.lastrowid
    for v in vehicles:
        conn.execute(
            "INSERT INTO submissions_vehicles (submission_id, photo, range_km, charging_time_h, weight_kg, price_ghs, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (sub_id, v.get("photo", ""), float(v["range_km"]) if v.get("range_km") else None, float(v["charging_time_h"]) if v.get("charging_time_h") else None, float(v["weight_kg"]) if v.get("weight_kg") else None, float(v["price_ghs"]) if v.get("price_ghs") else None, v.get("notes", ""), now)
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "id": sub_id, "vehicle_count": len(vehicles)}), 201


@app.route("/api/submissions/<int:sid>", methods=["PUT"])
def api_update(sid):
    d = request.json
    conn = get_db()
    existing = conn.execute("SELECT * FROM submissions WHERE id=?", (sid,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "not found"}), 404
    now = datetime.now(timezone.utc).isoformat()
    conn.execute("UPDATE submissions SET salesperson=?, region=?, district=?, updated_at=? WHERE id=?", (d.get("salesperson", existing["salesperson"]), d.get("region", existing["region"]), d.get("district", existing["district"]), now, sid))
    if "vehicles" in d:
        conn.execute("DELETE FROM submissions_vehicles WHERE submission_id=?", (sid,))
        for v in d["vehicles"]:
            conn.execute(
                "INSERT INTO submissions_vehicles (submission_id, photo, range_km, charging_time_h, weight_kg, price_ghs, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (sid, v.get("photo", ""), float(v["range_km"]) if v.get("range_km") else None, float(v["charging_time_h"]) if v.get("charging_time_h") else None, float(v["weight_kg"]) if v.get("weight_kg") else None, float(v["price_ghs"]) if v.get("price_ghs") else None, v.get("notes", ""), now)
            )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "id": sid})


@app.route("/api/submissions/<int:sid>", methods=["DELETE"])
def api_delete(sid):
    conn = get_db()
    conn.execute("DELETE FROM submissions_vehicles WHERE submission_id=?", (sid,))
    conn.execute("DELETE FROM submissions WHERE id=?", (sid,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/stats/summary", methods=["GET"])
def api_stats_summary():
    conn = get_db()
    s = {}
    s["total"] = conn.execute("SELECT COUNT(*) as cnt FROM submissions").fetchone()["cnt"]
    s["total_vehicles"] = conn.execute("SELECT COUNT(*) as cnt FROM submissions_vehicles").fetchone()["cnt"]
    avg_ghs = conn.execute("SELECT AVG(price_ghs) as v FROM submissions_vehicles WHERE price_ghs IS NOT NULL").fetchone()["v"]
    s["avg_price_ghs"] = round(avg_ghs, 2) if avg_ghs else 0
    min_ghs = conn.execute("SELECT MIN(price_ghs) as v FROM submissions_vehicles WHERE price_ghs IS NOT NULL").fetchone()["v"]
    s["min_price_ghs"] = round(min_ghs, 2) if min_ghs else 0
    max_ghs = conn.execute("SELECT MAX(price_ghs) as v FROM submissions_vehicles WHERE price_ghs IS NOT NULL").fetchone()["v"]
    s["max_price_ghs"] = round(max_ghs, 2) if max_ghs else 0
    s["regions"] = [r["region"] for r in conn.execute("SELECT DISTINCT region FROM submissions ORDER BY region").fetchall()]
    s["salespersons"] = [r["salesperson"] for r in conn.execute("SELECT DISTINCT salesperson FROM submissions ORDER BY salesperson").fetchall()]
    s["recent_7"] = conn.execute("SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s WHERE s.submitted_at >= datetime('now', '-7 days')").fetchone()["cnt"]
    s["recent_30"] = conn.execute("SELECT COUNT(DISTINCT s.id) as cnt FROM submissions s WHERE s.submitted_at >= datetime('now', '-30 days')").fetchone()["cnt"]
    s["by_region"] = []
    for r in conn.execute("SELECT sub.region, COUNT(sv.id) as cnt, AVG(sv.price_ghs) as avg_ghs, MIN(sv.price_ghs) as min_ghs, MAX(sv.price_ghs) as max_ghs FROM submissions_vehicles sv JOIN submissions sub ON sub.id = sv.submission_id GROUP BY sub.region ORDER BY cnt DESC"):
        s["by_region"].append({k: round(v, 2) if isinstance(v, float) else v for k, v in dict(r).items()})
    s["by_salesperson"] = []
    for r in conn.execute("SELECT sub.salesperson, COUNT(sv.id) as cnt, AVG(sv.price_ghs) as avg_ghs FROM submissions_vehicles sv JOIN submissions sub ON sub.id = sv.submission_id GROUP BY sub.salesperson ORDER BY cnt DESC"):
        s["by_salesperson"].append({k: round(v, 2) if isinstance(v, float) else v for k, v in dict(r).items()})
    conn.close()
    return jsonify(s)


@app.route("/api/settings", methods=["GET"])
def api_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    result = {}
    for r in rows:
        result[r["key"]] = r["value"]
    return jsonify(result)


@app.route("/api/export/csv", methods=["GET"])
def api_export_csv():
    conn = get_db()
    rows = conn.execute("SELECT sv.*, sub.salesperson, sub.region, sub.district, sub.submitted_at FROM submissions_vehicles sv JOIN submissions sub ON sub.id = sv.submission_id ORDER BY sub.submitted_at DESC, sv.created_at").fetchall()
    conn.close()
    if not rows:
        return "", 200
    headers = list(rows[0].keys())
    out_lines = []
    header_line = []
    for h in headers:
        header_line.append('"' + str(h).replace('"', '""') + '"')
    out_lines.append(",".join(header_line))
    for r in rows:
        vals = []
        for h in headers:
            v = r[h]
            if v is None:
                vals.append('""')
            else:
                val_str = str(v).replace('"', '""')
                vals.append('"' + val_str + '"')
        out_lines.append(",".join(vals))
    csv_text = "\ufeff" + "\n".join(out_lines)
    return csv_text, 200, {"Content-Type": "text/csv; charset=utf-8-sig", "Content-Disposition": "attachment; filename=survey_export.csv"}


@app.route("/api/export/json", methods=["GET"])
def api_export_json():
    conn = get_db()
    rows = conn.execute("SELECT sv.*, sub.salesperson, sub.region, sub.district, sub.submitted_at FROM submissions_vehicles sv JOIN submissions sub ON sub.id = sv.submission_id ORDER BY sub.submitted_at DESC, sv.created_at").fetchall()
    conn.close()
    export_data = {
        "metadata": {
            "title": "MOOVED Ghana E-Bike Market Survey (Multi-Model)",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "record_count": len(rows),
            "schema_version": "2.0",
            "description": "Each row is one vehicle model. Salesperson/region/district are repeated per model.",
            "fields": {
                "id": "vehicle record ID",
                "submission_id": "parent submission ID",
                "salesperson": "salesperson name",
                "region": "Ghana region",
                "district": "specific city/district",
                "photo": "vehicle photo URL or base64",
                "range_km": "range in km",
                "charging_time_h": "charging time in hours",
                "weight_kg": "bike weight in kg",
                "price_ghs": "price in Ghana Cedis (GHS)",
                "notes": "notes (brand/model/dealer etc)",
                "submitted_at": "ISO timestamp"
            }
        },
        "records": [dict(r) for r in rows]
    }
    return app.response_class(
        json.dumps(export_data, ensure_ascii=False, indent=2).encode("utf-8"),
        mimetype="application/json; charset=utf-8"
    )


if __name__ == "__main__":
    init_db()
    print("MOOVED E-Bike Multi-Model Survey Server running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
