"""Tests for ClassSchedule.runner (with mocked DB)."""

import pytest


def test_get_course_detail_returns_none_for_empty_string():
    from uw_course.ClassSchedule.runner import get_course_detail

    mock_db = None  # not used when input is invalid
    assert get_course_detail(mock_db, "") is None
    assert get_course_detail(mock_db, "   ") is None


def test_get_course_detail_returns_none_when_no_space_in_course_index():
    from uw_course.ClassSchedule.runner import get_course_detail

    mock_db = type("DB", (), {"CourseDescribe": None})()
    mock_db.CourseDescribe = None
    # When CourseDescribe is None, iterating would fail; implementation
    # uses find() which returns cursor. So we need a mock that returns []
    class MockCollection:
        def find(self, query):
            return iter([])

    mock_db.CourseDescribe = MockCollection()
    assert get_course_detail(mock_db, "NOSPACE") is None


def test_get_course_detail_returns_none_when_not_found():
    from uw_course.ClassSchedule.runner import get_course_detail

    class MockCollection:
        def find(self, query):
            return iter([])  # no matching course

    mock_db = type("DB", (), {})()
    mock_db.CourseDescribe = MockCollection()
    assert get_course_detail(mock_db, "CS 999") is None


def test_get_course_detail_returns_course_when_found():
    from uw_course.ClassSchedule.runner import get_course_detail

    doc = {"courseIndex": "136", "courseDescription": "Intro", "courseCredit": "0.5"}

    class MockCollection:
        def find(self, query):
            return iter([doc])

    mock_db = type("DB", (), {})()
    mock_db.CourseDescribe = MockCollection()
    result = get_course_detail(mock_db, "CS 136")
    assert result is not None
    assert result["courseIndex"] == "136"
    assert result["courseDescription"] == "Intro"


def test_search_availible_in_term_returns_course_list_when_found():
    from uw_course.ClassSchedule.runner import SearchAvalibleInTerm

    class MockCollection:
        def find(self, query):
            return iter([{"ClassIndex": "CS 136", "_id": 1234}])

    mock_db = type("DB", (), {"ClassCollectionName": "Class2024Winter"})()
    mock_db.ClassSchedule = MockCollection()
    result = SearchAvalibleInTerm(mock_db, "CS 136", quiet=True)
    assert result == ["CS 136"]


def test_search_availible_in_term_returns_course_and_class_id_when_class_num_given():
    from uw_course.ClassSchedule.runner import SearchAvalibleInTerm

    class MockCollection:
        def find(self, query):
            return iter([{"ClassIndex": "CS 136", "_id": 1234}])

    mock_db = type("DB", (), {"ClassCollectionName": "Class2024Winter"})()
    mock_db.ClassSchedule = MockCollection()
    result = SearchAvalibleInTerm(mock_db, "CS 136", classNum=1234, quiet=True)
    assert result == ["CS 136", 1234]
