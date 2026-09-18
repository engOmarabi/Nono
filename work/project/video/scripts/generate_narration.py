#!/usr/bin/env python3
"""
Generates narration audio for one episode via the Gemini API's native TTS
(gemini-2.5-flash-preview-tts), one file per scene, into public/audio/.

Usage:
    GEMINI_API_KEY=... python3 scripts/generate_narration.py [episode-01.json] [voice]

Reads GEMINI_API_KEY from the environment only — never hardcode it here.
"""
import base64
import json
import os
import sys
import time
import urllib.request
import wave
from pathlib import Path

VIDEO_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = VIDEO_DIR.parent
MODEL = "gemini-2.5-flash-preview-tts"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def strip_outer_guillemets(text: str) -> str:
    text = text.strip()
    if text.startswith("«") and text.endswith("»"):
        return text[1:-1]
    return text


def synthesize(api_key: str, text: str, voice: str, max_retries: int = 5) -> bytes:
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}
            },
        },
    }
    req = urllib.request.Request(
        f"{ENDPOINT}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    delay = 5
    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.load(resp)
            b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            return base64.b64decode(b64)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries:
                print(f"  rate limited, retrying in {delay}s (attempt {attempt}/{max_retries})")
                time.sleep(delay)
                delay *= 2
                continue
            raise


def write_wav(pcm_bytes: bytes, out_path: Path) -> None:
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(24000)
        wf.writeframes(pcm_bytes)


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: set GEMINI_API_KEY in the environment first.", file=sys.stderr)
        sys.exit(1)

    episode_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PROJECT_DIR / "episodes_data" / "episode-01.json"
    voice = sys.argv[2] if len(sys.argv) > 2 else "Kore"

    episode = json.loads(episode_path.read_text(encoding="utf-8"))
    out_dir = VIDEO_DIR / "public" / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, scene in enumerate(episode["scenes"], start=1):
        out_path = out_dir / f"scene-{i}.wav"
        if out_path.exists() and "--force" not in sys.argv:
            print(f"[{i}/{len(episode['scenes'])}] skipping (exists) -> {out_path.name}")
            continue
        text = strip_outer_guillemets(scene["narration"])
        print(f"[{i}/{len(episode['scenes'])}] synthesizing ({len(text)} chars) -> {out_path.name}")
        pcm = synthesize(api_key, text, voice)
        write_wav(pcm, out_path)
        time.sleep(3)  # be gentle with the preview model's rate limits

    print("Done.")


if __name__ == "__main__":
    main()
