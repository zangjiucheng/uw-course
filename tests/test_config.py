"""Tests for config module (env loading and MongoDB URI)."""

import pytest


def test_get_mongodb_uri_raises_when_unset(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    from uw_course.config import get_mongodb_uri

    with pytest.raises(ValueError, match="MONGODB_URI is not set"):
        get_mongodb_uri()


def test_get_mongodb_uri_returns_value_when_set(monkeypatch):
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017")
    from uw_course.config import get_mongodb_uri

    assert get_mongodb_uri() == "mongodb://localhost:27017"


def test_get_mongodb_uri_raises_when_empty_string(monkeypatch):
    monkeypatch.setenv("MONGODB_URI", "   ")
    from uw_course.config import get_mongodb_uri

    with pytest.raises(ValueError, match="MONGODB_URI is not set"):
        get_mongodb_uri()
