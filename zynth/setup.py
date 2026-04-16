from setuptools import setup

setup(
    name="zynth-ai-security",
    version="0.1.0",
    description="Adversarial security testing for AI agents and tool-using APIs",
    author="Zynth Founder",
    author_email="hello@zynth.com",
    packages=[
        "zynth",
        "zynth.backend",
        "zynth.backend.engine",
        "zynth.backend.tests",
    ],
    package_dir={
        "zynth": ".",
        "zynth.backend": "backend",
        "zynth.backend.engine": "backend/engine",
        "zynth.backend.tests": "backend/tests",
    },
    install_requires=[
        "fastapi>=0.100.0",
        "uvicorn>=0.20.0",
        "httpx>=0.24.0",
        "anthropic>=0.9.0",
        "pydantic",
        "sqlalchemy>=2.0.0",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "psycopg2-binary",
    ],
    entry_points={
        "console_scripts": [
            "zynth=zynth.cli:main",
        ]
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Security",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
)
