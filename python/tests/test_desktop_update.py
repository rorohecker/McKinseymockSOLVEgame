"""Release selection and verification guardrails for desktop updates."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from desktop_update import release_asset, version_tuple, download_verified, apply_update  # noqa: E402


class FakeDownload:
    url = "https://github.com/example/download"

    def __init__(self, data):
        self.data = data
        self.offset = 0

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self, size):
        chunk = self.data[self.offset:self.offset + size]
        self.offset += len(chunk)
        return chunk


class DesktopUpdate(unittest.TestCase):
    def test_only_newer_verified_release_is_selected(self):
        self.assertEqual(version_tuple("v1.4.2"), (1, 4, 2))
        self.assertIsNone(version_tuple("v1.4.2-beta"))
        asset = {"name": "SolvePracticeLab.exe", "digest": "sha256:" + "a" * 64,
                 "browser_download_url": "https://github.com/rorohecker/McKinseymockSOLVEgame/releases/download/v1.4.2/SolvePracticeLab.exe"}
        self.assertIsNone(release_asset({"tag_name": "v1.3.0", "assets": [asset]}))
        self.assertEqual(release_asset({"tag_name": "v1.4.2", "assets": [asset]})[2], "a" * 64)
        self.assertIsNone(release_asset({"tag_name": "v1.4.2", "assets": [{**asset, "digest": None}]}))
        self.assertIsNone(release_asset({"tag_name": "v1.4.2", "assets": [{**asset, "browser_download_url": "http://example.com/app.exe"}]}))

    def test_hash_mismatch_removes_download(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "release.exe"
            with patch("desktop_update.urlopen", return_value=FakeDownload(b"bad")):
                with self.assertRaisesRegex(ValueError, "SHA-256"):
                    download_verified("https://github.com/example", "0" * 64, target)
            self.assertFalse(target.exists())

    def test_replaces_executable_and_keeps_recovery_copy(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "SolvePracticeLab.exe"
            updates = root / "Updates"
            updates.mkdir()
            payload = updates / "SolvePracticeLab-v1.4.2.exe"
            target.write_bytes(b"old executable")
            payload.write_bytes(b"new executable")
            with patch("desktop_update.UPDATE_DIR", updates), \
                 patch("desktop_update.ctypes.windll.kernel32.OpenProcess", return_value=0), \
                 patch("desktop_update.subprocess.Popen") as launch:
                self.assertTrue(apply_update(target, payload, 999999))
            self.assertEqual(target.read_bytes(), b"new executable")
            self.assertEqual(target.with_suffix(".previous.exe").read_bytes(), b"old executable")
            self.assertFalse(payload.exists())
            launch.assert_called_once()


if __name__ == "__main__":
    unittest.main()
