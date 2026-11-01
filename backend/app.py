import threading
import time

from flask import Flask, jsonify, request
from flask_cors import CORS

from db import (
    authenticate_user,
    create_user,
    get_college_options,
    get_college,
    get_event,
    get_pending_friend_requests,
    get_public_profile,
    get_user_friends,
    get_user_by_id,
    load_sync_config,
    respond_to_friend_request,
    search_colleges,
    send_friend_request_by_id,
    send_friend_request_by_name,
    set_event_join_status,
    sync_all_event_sources,
    sync_localist_events_for_college,
    update_user_profile_image,
)


app = Flask(__name__)
CORS(app)
sync_thread_started = False


@app.get("/api/health")
def health():
    return jsonify({"status": "Backend is running"})


@app.post("/api/admin/sync-events")
def sync_events():
    payload = request.get_json(silent=True) or {}

    try:
        summary = sync_all_event_sources(
            days=payload.get("days"),
            per_page=payload.get("per_page"),
        )
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(summary)


@app.get("/api/colleges")
def colleges():
    query = request.args.get("query", "")
    return jsonify({"colleges": search_colleges(query) if query.strip() else []})


@app.get("/api/college-options")
def college_options():
    return jsonify({"colleges": get_college_options()})


@app.get("/api/colleges/<int:college_id>")
def college_details(college_id):
    college = get_college(college_id)

    if not college:
        return jsonify({"error": "College not found"}), 404

    return jsonify({"college": college})


@app.post("/api/signup")
def signup():
    payload = request.get_json(silent=True) or {}

    try:
        user = create_user(
            payload.get("name", ""),
            payload.get("gmail", ""),
            payload.get("password", ""),
            payload.get("college_id", ""),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"user": user}), 201


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}

    try:
        user = authenticate_user(payload.get("name", ""), payload.get("password", ""))
    except ValueError as error:
        return jsonify({"error": str(error)}), 401

    return jsonify({"user": user})


@app.get("/api/users/<int:user_id>")
def user_details(user_id):
    user = get_user_by_id(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user})


@app.get("/api/users/<int:user_id>/profile")
def public_profile(user_id):
    try:
        profile = get_public_profile(user_id)
    except ValueError as error:
        return jsonify({"error": str(error)}), 404

    return jsonify(profile)


@app.post("/api/users/<int:user_id>/profile-image")
def profile_image(user_id):
    payload = request.get_json(silent=True) or {}

    try:
        user = update_user_profile_image(user_id, payload.get("profile_image", ""))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"user": user})


@app.get("/api/users/<int:user_id>/friends")
def user_friends(user_id):
    try:
        friends = get_user_friends(user_id)
    except ValueError as error:
        return jsonify({"error": str(error)}), 404

    return jsonify({"friends": friends})


@app.post("/api/users/<int:user_id>/friends")
def add_user_friend(user_id):
    payload = request.get_json(silent=True) or {}

    try:
        if payload.get("friend_id"):
            friend_request = send_friend_request_by_id(user_id, payload.get("friend_id"))
        else:
            friend_request = send_friend_request_by_name(user_id, payload.get("name", ""))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"request": friend_request}), 201


@app.get("/api/users/<int:user_id>/friend-requests")
def pending_friend_requests(user_id):
    try:
        requests = get_pending_friend_requests(user_id)
    except ValueError as error:
        return jsonify({"error": str(error)}), 404

    return jsonify({"requests": requests})


@app.post("/api/users/<int:user_id>/friend-requests/<int:request_id>")
def answer_friend_request(user_id, request_id):
    payload = request.get_json(silent=True) or {}

    try:
        friends = respond_to_friend_request(user_id, request_id, payload.get("action", ""))
        requests = get_pending_friend_requests(user_id)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"friends": friends, "requests": requests})


@app.get("/api/colleges/<int:college_id>/events")
def college_events(college_id):
    user_id = request.args.get("user_id", type=int)

    try:
        events = sync_localist_events_for_college(college_id)
    except RuntimeError as error:
        return jsonify({"error": str(error), "events": []}), 502

    if user_id:
        from db import get_events_for_college
        events = get_events_for_college(college_id, user_id=user_id)

    return jsonify({"events": events, "source": "localist"})


def run_configured_auto_sync():
    config = load_sync_config()

    if not config.get("auto_sync_on_start"):
        return

    interval_seconds = max(60, int(config.get("auto_sync_interval_minutes", 360)) * 60)

    def sync_loop():
        while True:
            try:
                summary = sync_all_event_sources()
                print(
                    "UniSphere event sync complete: "
                    f"{summary['total_events']} events, "
                    f"{len(summary['failed'])} failures",
                    flush=True,
                )
            except RuntimeError as error:
                print(f"UniSphere event sync failed: {error}", flush=True)

            time.sleep(interval_seconds)

    thread = threading.Thread(target=sync_loop, daemon=True)
    thread.start()


def start_auto_sync_once():
    global sync_thread_started

    if sync_thread_started:
        return

    sync_thread_started = True
    run_configured_auto_sync()


@app.get("/api/events/<int:event_id>")
def event_details(event_id):
    user_id = request.args.get("user_id", type=int)
    event = get_event(event_id, user_id=user_id)

    if not event:
        return jsonify({"error": "Event not found"}), 404

    return jsonify({"event": event})


@app.post("/api/events/<int:event_id>/join")
def join_event(event_id):
    payload = request.get_json(silent=True) or {}

    try:
        event = set_event_join_status(
            event_id,
            payload.get("user_id"),
            bool(payload.get("joined")),
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"event": event})



start_auto_sync_once()


if __name__ == "__main__":
    app.run(debug=True)
