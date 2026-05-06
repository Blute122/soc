"""Database seeding - creates default admin user and sample data."""
from backend.database.connection import SessionLocal
from backend.models.asset import Asset
from backend.models.user import User, UserRole
from backend.security import hash_password


def seed_database():
    """Create default users if they don't exist."""
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users = [
                User(username="admin", email="admin@soc-lab.local",
                     password_hash=hash_password("admin123"),
                     full_name="SOC Administrator", role=UserRole.ADMIN),
                User(username="analyst1", email="analyst1@soc-lab.local",
                     password_hash=hash_password("analyst123"),
                     full_name="Sarah Chen", role=UserRole.ANALYST_L1),
                User(username="analyst2", email="analyst2@soc-lab.local",
                     password_hash=hash_password("analyst123"),
                     full_name="James Rodriguez", role=UserRole.ANALYST_L2),
                User(username="hunter", email="hunter@soc-lab.local",
                     password_hash=hash_password("hunter123"),
                     full_name="Alex Kovalev", role=UserRole.THREAT_HUNTER),
                User(username="responder", email="ir@soc-lab.local",
                     password_hash=hash_password("responder123"),
                     full_name="Maya Patel", role=UserRole.INCIDENT_RESPONDER),
            ]
            db.add_all(users)
            db.commit()
            print("[SEED] Default users created")
        if db.query(Asset).count() == 0:
            assets = [
                Asset(hostname="DC01", ip_address="10.0.1.10", asset_type="domain_controller",
                      operating_system="Windows Server 2022", owner="Identity Team",
                      business_unit="IT", criticality="critical", risk_score=86, status="online",
                      location="Primary Datacenter"),
                Asset(hostname="EXCHANGE01", ip_address="10.0.1.20", asset_type="server",
                      operating_system="Windows Server 2019", owner="Messaging Team",
                      business_unit="IT", criticality="high", risk_score=72, status="online",
                      location="Primary Datacenter"),
                Asset(hostname="SQL-SRV01", ip_address="10.0.2.30", asset_type="server",
                      operating_system="Windows Server 2022", owner="Data Platform",
                      business_unit="Finance", criticality="critical", risk_score=81, status="online",
                      location="Primary Datacenter"),
                Asset(hostname="WEB-SRV01", ip_address="10.0.3.40", asset_type="server",
                      operating_system="Ubuntu 24.04 LTS", owner="AppSec",
                      business_unit="Engineering", criticality="high", risk_score=68, status="degraded",
                      location="DMZ"),
                Asset(hostname="FILE-SRV01", ip_address="10.0.1.50", asset_type="server",
                      operating_system="Windows Server 2019", owner="Infrastructure",
                      business_unit="Operations", criticality="high", risk_score=64, status="online",
                      location="Primary Datacenter"),
                Asset(hostname="WS-PC001", ip_address="10.0.2.60", asset_type="workstation",
                      operating_system="Windows 11 Enterprise", owner="Sarah Chen",
                      business_unit="Security", criticality="medium", risk_score=44, status="online",
                      location="SOC Floor"),
                Asset(hostname="HR-PC01", ip_address="10.0.4.25", asset_type="workstation",
                      operating_system="Windows 11 Enterprise", owner="Karen Lee",
                      business_unit="HR", criticality="medium", risk_score=58, status="online",
                      location="Headquarters"),
                Asset(hostname="jump-box", ip_address="10.0.5.15", asset_type="server",
                      operating_system="Ubuntu 22.04 LTS", owner="DevOps",
                      business_unit="Engineering", criticality="critical", risk_score=79, status="online",
                      location="Cloud VPC"),
                Asset(hostname="aws-us-east-1", ip_address="10.10.1.5", asset_type="cloud",
                      operating_system="AWS Account", owner="Cloud Platform",
                      business_unit="Engineering", criticality="critical", risk_score=74, status="online",
                      location="us-east-1"),
            ]
            db.add_all(assets)
            db.commit()
            print("[SEED] Asset inventory created")
    finally:
        db.close()
