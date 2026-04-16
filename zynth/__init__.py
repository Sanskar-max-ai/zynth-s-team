__all__ = ["Client", "ScanReport", "SecurityEngine"]


def __getattr__(name):
    if name in {"Client", "ScanReport"}:
        from .sdk import Client, ScanReport

        return {"Client": Client, "ScanReport": ScanReport}[name]
    if name == "SecurityEngine":
        from .backend.engine.security import SecurityEngine

        return SecurityEngine
    raise AttributeError(f"module 'zynth' has no attribute {name!r}")
