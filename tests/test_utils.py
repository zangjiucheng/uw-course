"""Tests for utility modules."""

import pytest


def test_random_color_returns_hex_string():
    from uw_course.Utiles.randomColor import randomColor

    color = randomColor()
    assert isinstance(color, str)
    assert color.startswith("#")
    assert len(color) == 7


def test_random_gray_returns_fixed_value():
    from uw_course.Utiles.randomColor import randomGray

    assert randomGray() == "#9E9E9E"
