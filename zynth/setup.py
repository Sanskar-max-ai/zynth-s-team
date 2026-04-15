from setuptools import setup, find_packages

setup(
    name="zynth-ai-security",
    version="0.1.0",
    description="Enterprise Adverarial AI Security Engine",
    author="Zynth Founder",
    author_email="hello@zynth.com",
    packages=find_packages(),
    # Map the root 'backend' folder to our 'zynth' Python import space
    package_dir={
        'zynth': 'backend',
        'zynth.engine': 'backend/engine',
        'zynth.tests': 'backend/tests'
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
        "psycopg2-binary"
    ],
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
