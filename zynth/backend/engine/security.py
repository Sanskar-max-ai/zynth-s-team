try:
    from ..tests.test_engine import SecurityEngine, VulnerabilityJudge
except ImportError:
    from tests.test_engine import SecurityEngine, VulnerabilityJudge

__all__ = ["SecurityEngine", "VulnerabilityJudge"]
