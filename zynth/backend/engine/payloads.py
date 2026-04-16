try:
    from ..tests.test_payloads import ALL_TESTS, GANDALF_SPECIFIC_TESTS, QUICK_SCAN_TESTS
except ImportError:
    from tests.test_payloads import ALL_TESTS, GANDALF_SPECIFIC_TESTS, QUICK_SCAN_TESTS

__all__ = ["ALL_TESTS", "GANDALF_SPECIFIC_TESTS", "QUICK_SCAN_TESTS"]
