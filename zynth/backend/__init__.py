__all__ = ["SecurityEngine"]


def __getattr__(name):
    if name == "SecurityEngine":
        from .engine.security import SecurityEngine

        return SecurityEngine
    raise AttributeError(f"module 'zynth.backend' has no attribute {name!r}")
