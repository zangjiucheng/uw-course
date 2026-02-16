"""Pytest configuration and shared fixtures."""

import os

import pytest


@pytest.fixture(autouse=True)
def clean_mongodb_env(monkeypatch):
    """Ensure tests don't accidentally use real MONGODB_URI from environment."""
    monkeypatch.delenv("MONGODB_URI", raising=False)
