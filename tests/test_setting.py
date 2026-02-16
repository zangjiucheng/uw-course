"""Tests for Setting class."""

import os

import pytest


def test_setting_default_attributes():
    from uw_course.setting import Setting

    s = Setting()
    assert s.dataName == "./uw-course-files"
    assert s.configFileName == "schedule.out"
    assert s.outDir == os.path.join("./uw-course-files", "schedule.out")


def test_setting_creates_data_directory():
    from uw_course.setting import Setting

    s = Setting()
    assert os.path.isdir(s.dataName)
