from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence

from .backend.engine.payloads import ALL_TESTS, GANDALF_SPECIFIC_TESTS, QUICK_SCAN_TESTS
from .backend.engine.security import SecurityEngine


@dataclass
class ScanReport:
    summary: Dict[str, Any]
    detailed_results: List[Dict[str, Any]]

    @property
    def vulnerabilities(self) -> List[Dict[str, Any]]:
        return [result for result in self.detailed_results if result.get("is_vulnerable")]

    @property
    def risk_score(self) -> float:
        return float(self.summary.get("risk_score", 0.0))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "summary": self.summary,
            "detailed_results": self.detailed_results,
        }


class Client:
    """
    Lightweight SDK entrypoint for running Zynth scans from Python.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        target: str = "mock",
        target_endpoint: Optional[str] = None,
    ):
        self.api_key = api_key
        self.target = target
        self.target_endpoint = target_endpoint

    def _resolve_tests(
        self,
        tests: Optional[Sequence[Dict[str, Any]]] = None,
        full_scan: bool = False,
    ) -> List[Dict[str, Any]]:
        if tests is not None:
            return list(tests)
        if self.target == "gandalf":
            return GANDALF_SPECIFIC_TESTS
        if self.target == "mock" and full_scan:
            return ALL_TESTS
        return QUICK_SCAN_TESTS

    async def scan_async(
        self,
        tests: Optional[Sequence[Dict[str, Any]]] = None,
        *,
        full_scan: bool = False,
        mutate: bool = False,
        use_llm_judge: bool = True,
    ) -> ScanReport:
        engine = SecurityEngine(
            api_key=self.api_key,
            target=self.target,
            target_endpoint=self.target_endpoint,
        )
        report = await engine.run_scan(
            self._resolve_tests(tests=tests, full_scan=full_scan),
            mutate=mutate,
            use_llm_judge=use_llm_judge,
        )
        return ScanReport(**report)

    def scan(
        self,
        tests: Optional[Sequence[Dict[str, Any]]] = None,
        *,
        full_scan: bool = False,
        mutate: bool = False,
        use_llm_judge: bool = True,
    ) -> ScanReport:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(
                self.scan_async(
                    tests=tests,
                    full_scan=full_scan,
                    mutate=mutate,
                    use_llm_judge=use_llm_judge,
                )
            )
        raise RuntimeError(
            "Client.scan() cannot be called from an active event loop. Use scan_async() instead."
        )
