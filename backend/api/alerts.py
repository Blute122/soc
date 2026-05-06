"""Alerts API endpoints."""
import json
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from typing import Optional
from backend.database.connection import get_db
from backend.models.alert import Alert
from backend.models.incident import Incident, IncidentNote
from backend.models.user import User
from backend.api.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

SLA_HOURS = {"critical": 4, "high": 8, "medium": 24, "low": 72}


class AlertResponse(BaseModel):
    id: int
    timestamp: str
    title: str
    description: str
    severity: str
    status: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    rule_name: str
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    mitre_technique_name: Optional[str] = None
    hostname: Optional[str] = None
    username: Optional[str] = None
    recommended_action: Optional[str] = None
    event_count: int = 1
    incident_id: Optional[int] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[AlertResponse])
def get_alerts(
    severity: Optional[str] = None, status: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db), _user=Depends(get_current_user),
):
    q = db.query(Alert).order_by(desc(Alert.timestamp))
    if severity:
        q = q.filter(Alert.severity == severity)
    if status:
        q = q.filter(Alert.status == status)
    alerts = q.offset(offset).limit(limit).all()
    return [AlertResponse(
        id=a.id, timestamp=str(a.timestamp), title=a.title, description=a.description,
        severity=a.severity, status=a.status, source_ip=a.source_ip,
        destination_ip=a.destination_ip, rule_name=a.rule_name,
        mitre_tactic=a.mitre_tactic, mitre_technique=a.mitre_technique,
        mitre_technique_name=a.mitre_technique_name, hostname=a.hostname,
        username=a.username, recommended_action=a.recommended_action,
        event_count=a.event_count or 1, incident_id=a.incident_id,
    ) for a in alerts]


@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    total = db.query(func.count(Alert.id)).scalar()
    by_severity = dict(db.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all())
    by_status = dict(db.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all())
    return {"total": total, "by_severity": by_severity, "by_status": by_status}


@router.patch("/{alert_id}/status")
def update_alert_status(alert_id: int, status: str, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = status
    db.commit()
    return {"message": "Alert status updated", "id": alert_id, "status": status}


@router.post("/{alert_id}/incident")
def create_incident_from_alert(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.incident_id:
        return {"message": "Alert already attached to incident", "incident_id": alert.incident_id}

    sla_hours = SLA_HOURS.get(alert.severity, 24)
    affected_assets = [value for value in [alert.hostname, alert.source_ip, alert.destination_ip] if value]
    mitre = [alert.mitre_technique] if alert.mitre_technique else []
    iocs = [value for value in [alert.source_ip, alert.destination_ip] if value]
    incident = Incident(
        title=f"{alert.severity.upper()} - {alert.title}",
        description=f"{alert.description}\n\nRecommended action: {alert.recommended_action or 'Triage alert and validate scope.'}",
        severity=alert.severity,
        category=alert.rule_name,
        assigned_to=user.id,
        created_by=user.id,
        sla_deadline=datetime.now(timezone.utc) + timedelta(hours=sla_hours),
        evidence=json.dumps([{
            "type": "alert",
            "alert_id": alert.id,
            "title": alert.title,
            "timestamp": str(alert.timestamp),
            "rule": alert.rule_name,
        }]),
        affected_assets=json.dumps(affected_assets),
        mitre_techniques=json.dumps(mitre),
        ioc_list=json.dumps(iocs),
        alert_count=1,
    )
    db.add(incident)
    db.flush()

    alert.incident_id = incident.id
    alert.status = "investigating"
    note = IncidentNote(
        incident_id=incident.id,
        author_id=user.id,
        note_type="timeline",
        content=f"Incident opened from alert #{alert.id}: {alert.title}",
    )
    db.add(note)
    db.commit()
    db.refresh(incident)
    return {
        "message": "Incident created from alert",
        "incident_id": incident.id,
        "alert_id": alert.id,
        "status": alert.status,
    }
