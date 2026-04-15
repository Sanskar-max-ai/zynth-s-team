from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="workspace")
    scans = relationship("ScanHistory", back_populates="workspace")
    firewall_logs = relationship("FirewallLog", back_populates="workspace")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="users")

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    target = Column(String)
    risk_score = Column(Float)
    vulnerabilities = Column(Integer)
    total_tests = Column(Integer)
    trend = Column(Float, default=0.0)

    workspace = relationship("Workspace", back_populates="scans")

class FirewallLog(Base):
    __tablename__ = "firewall_logs"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String)
    payload_snippet = Column(Text)
    action = Column(String) # "ALLOW" or "BLOCK"
    category = Column(String)
    reason = Column(String)

    workspace = relationship("Workspace", back_populates="firewall_logs")
